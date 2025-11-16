'use server';

/**
 * @fileOverview AI-powered flashcard generator from notes or text using Groq.
 *
 * - generateFlashcards - A function that generates flashcards from input text.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GenerateFlashcardsInputSchema = z.object({
  text: z
    .string()
    .describe('The notes or text to extract flashcards from.'),
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string().describe('The question for the flashcard.'),
      answer: z.string().describe('The answer to the question.'),
      type: z
        .enum(['Q/A', 'Definition', 'Concept', 'Mnemonic'])
        .describe('The type of flashcard.'),
    })
  ).describe('An array of flashcards generated from the input text.'),
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const systemPrompt = `You are an expert educator who can create flashcards from notes or text.

Given the following text, extract Q/A pairs, key definitions, concepts, and mnemonics to create flashcards.

You must respond in a valid JSON format. Do not include any markdown or other formatting in your response. The JSON object should conform to the following Zod schema:
${JSON.stringify(GenerateFlashcardsOutputSchema.shape)}
`;

    const userPrompt = `Text: ${input.text}`;

    const result = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const responseText = result.choices[0].message.content;
    
    // It's possible the model still wraps the JSON in markdown
    const cleanedResponse = responseText?.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanedResponse || '{}');
      return GenerateFlashcardsOutputSchema.parse(parsed);
    } catch (e)      console.error("Failed to parse AI response:", e);
      throw new Error("The AI returned an invalid response format.");
    }
  }
);
