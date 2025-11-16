'use server';

/**
 * @fileOverview AI-powered flashcard generator from text, PDF, or images using Groq + Cloudinary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Groq from 'groq-sdk';
import { v2 as cloudinary } from 'cloudinary';

// -----------------------------
// Cloudinary Config
// -----------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -----------------------------
// Helper: Upload image to Cloudinary
// -----------------------------
async function uploadToCloudinary(base64Image: string): Promise<string> {
  const dataUri = base64Image.startsWith('data:')
    ? base64Image
    : `data:image/png;base64,${base64Image}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'flashcards',
    resource_type: 'image',
  });

  return result.secure_url;
}

// -----------------------------
// Groq SDK
// -----------------------------
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// -----------------------------
// Input Schema
// -----------------------------
const GenerateFlashcardsInputSchema = z.object({
  text: z.string().optional(),
  pdfData: z.string().optional(),
  imageData: z.string().optional(), // base64 image string
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

// -----------------------------
// Output Schema
// -----------------------------
const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      type: z.enum(["Q/A", "Definition", "Concept", "Mnemonic"]),
    })
  ),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

// -----------------------------
// Main server action
// -----------------------------
export async function generateFlashcards(
  input: GenerateFlashcardsInput
): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

// -----------------------------
// Flow
// -----------------------------
const generateFlashcardsFlow = ai.defineFlow(
  {
    name: "generateFlashcardsFlow",
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },

  async (input) => {
    let sourceText = input.text?.trim() || "";

    // -----------------------------
    // PDF Handling
    // -----------------------------
    if (input.pdfData) {
      const pdf = (await import("pdf-parse")).default;
      const pdfBuffer = Buffer.from(input.pdfData, "base64");
      const pdfData = await pdf(pdfBuffer);
      sourceText += "\n" + (pdfData.text?.trim() || "");
    }

    // -----------------------------
    // Image OCR via Groq
    // -----------------------------
    if (input.imageData) {
      // 1️⃣ Upload to Cloudinary (or any public URL) if needed
      const imageUrl = await uploadToCloudinary(input.imageData);

      // 2️⃣ Send to Groq OCR model
      const ocr = await groq.chat.completions.create({
        model: "llama-4-maverick-17b-128e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extract ALL readable text from this image. Return pure text only." },
              { type: "image_url", image_url: imageUrl as any } // cast to satisfy TypeScript
            ]
          }
        ]
      });

      const extracted = ocr.choices?.[0]?.message?.content || "";
      sourceText += "\n" + extracted.trim();
    }


    // -----------------------------
    // Input validation
    // -----------------------------
    if (!sourceText.trim()) {
      throw new Error("No valid text extracted. Please provide notes, a PDF, or a readable image.");
    }

    // -----------------------------
    // Flashcard generation prompt
    // -----------------------------
    const systemPrompt = `
You are an expert educator who generates flashcards from text.

RULES:
- Return ONLY valid JSON. No markdown.
- Never leave fields empty.
- "question" must be a clear question.
- "answer" must be short but complete.
- "type" must be one of: "Q/A", "Definition", "Concept", "Mnemonic".
`;

    const userPrompt = `Generate flashcards from the following text:\n${sourceText}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-70b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });

    let jsonText = response.choices?.[0]?.message?.content || "{}";
    jsonText = jsonText.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("Invalid JSON:", jsonText);
      throw new Error("Groq returned invalid JSON.");
    }

    // -----------------------------
    // Sanitize flashcards
    // -----------------------------
    parsed.flashcards = Array.isArray(parsed.flashcards)
      ? parsed.flashcards.map((fc: any) => ({
        question: fc.question?.trim() || "What is the key idea?",
        answer: fc.answer?.trim() || "The text explains the main concept.",
        type: ["Q/A", "Definition", "Concept", "Mnemonic"].includes(fc.type)
          ? fc.type
          : "Q/A",
      }))
      : [];

    return GenerateFlashcardsOutputSchema.parse(parsed);
  }
);
