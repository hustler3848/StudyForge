'use server';
/**
 * @fileOverview An AI agent that provides motivational messages during focus mode.
 *
 * - generateMotivationNudge - A function that generates a motivational message.
 * - MotivationNudgeOutput - The return type for the generateMotivationNudge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MotivationNudgeOutputSchema = z.object({
  message: z.string().describe('A motivational message to encourage the user to stay focused.'),
});
export type MotivationNudgeOutput = z.infer<typeof MotivationNudgeOutputSchema>;

export async function generateMotivationNudge(): Promise<MotivationNudgeOutput> {
  return generateMotivationNudgeFlow();
}

const prompt = ai.definePrompt({
  name: 'motivationNudgePrompt',
  output: {schema: MotivationNudgeOutputSchema},
  prompt: `You are a motivational coach. Generate a short, encouraging message to help a student stay focused during a study session. The message should be no more than 20 words.`,
});

const generateMotivationNudgeFlow = ai.defineFlow({
  name: 'generateMotivationNudgeFlow',
  outputSchema: MotivationNudgeOutputSchema,
}, async () => {
  const {output} = await prompt({});
  return output!;
});
