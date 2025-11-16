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
  text: z.string(),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

// OUTPUT SCHEMA
const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
      type: z.enum(['Q/A', 'Definition', 'Concept', 'Mnemonic']),
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
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const systemPrompt = `
You are an expert educator who creates flashcards from text.
Return ONLY VALID JSON. No markdown, no commentary.
NEVER leave fields empty. If unsure, generate a reasonable value.

FLASHCARD RULES:
- "question" must be a clear question.
- "answer" must be a short but complete answer.
- "type" must ALWAYS be one of: "Q/A", "Definition", "Concept", "Mnemonic".

The JSON MUST follow this structure:
{
  "flashcards": [
    { "question": "string", "answer": "string", "type": "Q/A | Definition | Concept | Mnemonic" }
  ]
}
`;

    const userPrompt = `Text:\n${input.text}`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    let jsonText = result.choices[0].message.content || "{}";

    // Remove accidental ```json blocks
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("JSON parse error:", jsonText);
      throw new Error("Groq returned invalid JSON.");
    }

    // 🛡 Fallback: Ensure every flashcard has required fields
    if (Array.isArray(parsed.flashcards)) {
      parsed.flashcards = parsed.flashcards.map((fc: any) => ({
        question: fc.question || "What is the key idea?",
        answer: fc.answer || "The text explains the main concept.",
        type: (["Q/A", "Definition", "Concept", "Mnemonic"].includes(fc.type)
          ? fc.type
          : "Q/A"),
      }));
    } else {
      parsed.flashcards = [];
    }

    // Validate with Zod
    return GenerateFlashcardsOutputSchema.parse(parsed);
  }
);
