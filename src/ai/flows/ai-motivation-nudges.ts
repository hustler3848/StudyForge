
'use server';

/**
 * @fileOverview An AI agent that provides motivational messages using Groq.
 *
 * - generateMotivationNudge - A function that generates a motivational message.
 * - MotivationNudgeOutput - The return type for the generateMotivationNudge function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MotivationNudgeOutputSchema = z.object({
  message: z
    .string()
    .describe('A motivational message to encourage the user to stay focused.'),
});
export type MotivationNudgeOutput = z.infer<
  typeof MotivationNudgeOutputSchema
>;

export async function generateMotivationNudge(): Promise<MotivationNudgeOutput> {
  return generateMotivationNudgeFlow();
}

const generateMotivationNudgeFlow = ai.defineFlow(
  {
    name: 'generateMotivationNudgeFlow',
    outputSchema: MotivationNudgeOutputSchema,
  },
  async () => {
    try {
      const systemPrompt = `
You are a motivational coach. 
Generate a short, encouraging message to help a student stay focused during a study session.
The message should be no more than 20 words.
Return ONLY VALID JSON of the shape: { "message": "Your motivational quote here." }
Do not include any other text or markdown.
`;

      const result = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [{ role: 'system', content: systemPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const jsonText = result.choices[0].message.content || '{}';
      const parsed = JSON.parse(jsonText);

      // Validate with Zod
      return MotivationNudgeOutputSchema.parse(parsed);
    } catch (error) {
      console.error('Error generating motivation nudge with Groq:', error);
      // Provide a fallback message in case of an API error
      return {
        message: "The secret to getting ahead is getting started.",
      };
    }
  }
);
