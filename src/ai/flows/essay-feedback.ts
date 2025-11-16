'use server';
/**
 * @fileOverview An AI agent that provides feedback on essays using Groq.
 *
 * - analyzeEssay - A function that analyzes an essay and provides feedback.
 * - AnalyzeEssayInput - The input type for the analyzeEssay function.
 * - AnalyzeEssayOutput - The return type for the analyzeEssay function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

const analyzeEssayFlow = ai.defineFlow(
  {
    name: 'analyzeEssayFlow',
    inputSchema: AnalyzeEssayInputSchema,
    outputSchema: AnalyzeEssayOutputSchema,
  },
  async (input) => {
    const systemPrompt = `You are an AI essay feedback assistant. Analyze the essay provided and provide feedback on the following aspects:

- Grammar: Provide a grammar score from 0-100.
- Readability: Provide a readability score.
- Clarity: Provide suggestions for improving the clarity of the essay.
- Structure: Provide suggestions for improving the structure of the essay.
- Tone: Analyze the tone of the essay.
- Rewrite: Provide a full corrected rewrite of the essay.

You must respond in a valid JSON format. Do not include any markdown or other formatting in your response. The JSON object should conform to the following Zod schema:
${JSON.stringify(AnalyzeEssayOutputSchema.shape)}
`;

    const userPrompt = `Essay:\n${input.text}`;

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
      return AnalyzeEssayOutputSchema.parse(parsed);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      throw new Error("The AI returned an invalid response format.");
    }
  }
);
