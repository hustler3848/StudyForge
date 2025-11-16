'use server';

/**
 * @fileOverview AI-powered flashcard generator from notes or text.
 *
 * - generateFlashcards - A function that generates flashcards from input text.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

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

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `You are an expert educator who can create flashcards from notes or text.

  Given the following text, extract Q/A pairs, key definitions, concepts, and mnemonics to create flashcards.

  Return an array of flashcards in the following JSON format:
  {
    "flashcards": [
      {
        "question": "",
        "answer": "",
        "type": "Q/A" | "Definition" | "Concept" | "Mnemonic"
      }
    ]
  }

  Text: {{{text}}}`,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
