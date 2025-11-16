'use server';
export const runtime = "nodejs";

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
  pdfData: z.string().optional(), // base64 PDF string
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

// MAIN EXPORT
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

    // -------------------------------
    // 📄 PDF HANDLING (Node-only)
    // -------------------------------
    if (input.pdfData) {
      const pdf = (await import("pdf-parse")).default; // dynamic import for Next.js compatibility
      const pdfBuffer = Buffer.from(input.pdfData, "base64");
      const data = await pdf(pdfBuffer);

      sourceText = data.text?.trim();
    }

    if (!sourceText) {
      throw new Error("No valid text extracted. Please provide text or a PDF.");
    }

    // -------------------------------
    // 🧠 PROMPTS
    // -------------------------------
    const systemPrompt = `
You are an expert educator who generates flashcards from text.

RULES:
- Output MUST be ONLY VALID JSON. No markdown, no extra text.
- NEVER leave fields empty.
- "question" must always be a clear question.
- "answer" must be short but complete.
- "type" must be exactly one of: "Q/A", "Definition", "Concept", "Mnemonic".

Valid JSON structure:
{
  "flashcards": [
    { "question": "string", "answer": "string", "type": "Q/A | Definition | Concept | Mnemonic" }
  ]
}
`;

    const userPrompt = `Generate flashcards from the following text:\n${sourceText}`;

    // -------------------------------
    // 🤖 LLM CALL (Groq)
    // -------------------------------
    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.3,
    });

    let jsonText = result.choices?.[0]?.message?.content || "{}";

    // Remove accidental ```json or ``` wrappers
    jsonText = jsonText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // -------------------------------
    // 🛠 JSON Parsing
    // -------------------------------
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("Invalid JSON from Groq:", jsonText);
      throw new Error("Groq returned invalid JSON.");
    }

    // -----------------------------------
    // 🛡 SAFETY: Normalize flashcard fields
    // -----------------------------------
    if (!Array.isArray(parsed.flashcards)) {
      parsed.flashcards = [];
    }

    parsed.flashcards = parsed.flashcards.map((fc: any) => ({
      question: typeof fc.question === "string" && fc.question.trim()
        ? fc.question.trim()
        : "What is the key idea?",
      answer: typeof fc.answer === "string" && fc.answer.trim()
        ? fc.answer.trim()
        : "The text explains the main concept.",
      type: ["Q/A", "Definition", "Concept", "Mnemonic"].includes(fc.type)
        ? fc.type
        : "Q/A",
    }));

    // Validate final output with Zod
    return GenerateFlashcardsOutputSchema.parse(parsed);
  }
);
