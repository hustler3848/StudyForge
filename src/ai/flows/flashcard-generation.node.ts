'use server';

/**
 * @fileOverview AI-powered flashcard generator from notes or text using Groq.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// INPUT SCHEMA
const GenerateFlashcardsInputSchema = z.object({
  text: z.string().optional(),
  pdfData: z.string().optional(),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

// OUTPUT SCHEMA
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

// MAIN EXPORT (server action)
export async function generateFlashcards(
  input: GenerateFlashcardsInput
): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

// FLOW
const generateFlashcardsFlow = ai.defineFlow(
  {
    name: "generateFlashcardsFlow",
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    let sourceText = input.text?.trim();

    // PDF handling — dynamic import required in Next.js
    if (input.pdfData) {
      const pdf = (await import("pdf-parse")).default;
      const pdfBuffer = Buffer.from(input.pdfData, "base64");
      const pdfData = await pdf(pdfBuffer);
      sourceText = pdfData.text?.trim();
    }

    if (!sourceText) {
      throw new Error("No valid text extracted. Please provide text or a PDF.");
    }

    const systemPrompt = `
You are an expert educator who generates flashcards from text.

RULES:
- Output MUST be ONLY VALID JSON. No markdown or commentary.
- Never leave fields empty.
- "question" must be a clear question.
- "answer" must be short but complete.
- "type" must be one of: "Q/A", "Definition", "Concept", "Mnemonic".
`;

    const userPrompt = `Generate flashcards from the following text:\n${sourceText}`;

    const result = await groq.chat.completions.create({
      model: "llama-3.1-70b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1200,
    });

    let jsonText = result.choices?.[0]?.message?.content || "{}";

    jsonText = jsonText.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("Invalid JSON:", jsonText);
      throw new Error("Groq returned invalid JSON.");
    }

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
