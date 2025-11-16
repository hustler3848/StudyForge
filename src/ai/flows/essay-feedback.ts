'use server';
/**
 * @fileOverview An AI agent that provides feedback on essays.
 *
 * - analyzeEssay - A function that analyzes an essay and provides feedback.
 * - AnalyzeEssayInput - The input type for the analyzeEssay function.
 * - AnalyzeEssayOutput - The return type for the analyzeEssay function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const AnalyzeEssayInputSchema = z.object({
  text: z.string().describe('The text of the essay to analyze.'),
});
export type AnalyzeEssayInput = z.infer<typeof AnalyzeEssayInputSchema>;

const AnalyzeEssayOutputSchema = z.object({
  grammarScore: z.number().describe('A score from 0-100 representing the grammar quality of the essay.'),
  readabilityScore: z.number().describe('A score representing the readability of the essay.'),
  claritySuggestions: z.string().describe('Suggestions for improving the clarity of the essay.'),
  structuralSuggestions: z.string().describe('Suggestions for improving the structure of the essay.'),
  toneAnalysis: z.string().describe('An analysis of the tone of the essay.'),
  correctedRewrite: z.string().optional().describe('A full corrected rewrite of the essay.'),
});
export type AnalyzeEssayOutput = z.infer<typeof AnalyzeEssayOutputSchema>;

export async function analyzeEssay(input: AnalyzeEssayInput): Promise<AnalyzeEssayOutput> {
  return analyzeEssayFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeEssayPrompt',
  input: {schema: AnalyzeEssayInputSchema},
  output: {schema: AnalyzeEssayOutputSchema},
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `You are an AI essay feedback assistant. Analyze the essay provided and provide feedback on the following aspects:\n\n- Grammar: Provide a grammar score from 0-100.\n- Readability: Provide a readability score.\n- Clarity: Provide suggestions for improving the clarity of the essay.\n- Structure: Provide suggestions for improving the structure of the essay.\n- Tone: Analyze the tone of the essay.\n- Rewrite: Provide a full corrected rewrite of the essay.\n\nEssay:\n{{{text}}}`,
});

const analyzeEssayFlow = ai.defineFlow(
  {
    name: 'analyzeEssayFlow',
    inputSchema: AnalyzeEssayInputSchema,
    outputSchema: AnalyzeEssayOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
