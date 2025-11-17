
'use server';

/**
 * @fileOverview AI-powered exam readiness calculator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// INPUT SCHEMA
const ExamReadinessInputSchema = z.object({
  hoursStudied: z.number(),
  subject: z.string().describe('The name of the exam subject, e.g., "Advanced Calculus"'),
  consistency: z.string().describe('e.g., studied 4 out of 7 days'),
  quizzesSolved: z.number(),
  deadlineProximity: z.string().describe('e.g., "in 3 days", "in 2 weeks"'),
});
export type ExamReadinessInput = z.infer<typeof ExamReadinessInputSchema>;

// OUTPUT SCHEMA
const ExamReadinessOutputSchema = z.object({
  readinessScore: z.number().min(0).max(100),
  coachingTip: z.string(),
});
export type ExamReadinessOutput = z.infer<typeof ExamReadinessOutputSchema>;

// EXPORT
export async function calculateExamReadiness(
  input: ExamReadinessInput
): Promise<ExamReadinessOutput> {
  return calculateExamReadinessFlow(input);
}

// FLOW
const calculateExamReadinessFlow = ai.defineFlow(
  {
    name: 'calculateExamReadinessFlow',
    inputSchema: ExamReadinessInputSchema,
    outputSchema: ExamReadinessOutputSchema,
  },
  async (input) => {
    const systemPrompt = `
You are a smart productivity coach. Your task is to calculate an "Exam Readiness Score" based on the provided student data.

RULES:
- Return ONLY VALID JSON, no markdown or commentary.
- readinessScore MUST be a number between 0 and 100.
- coachingTip MUST be a short, encouraging, and actionable tip (max 25 words).
- Analyze all inputs to determine the score.
- **You must infer the difficulty from the subject name.** For example, "Advanced Calculus" is harder than "History 101".
- High hours, consistency, and solved quizzes improve the score. A close deadline and high inferred difficulty negatively impact the score if other factors are low.

The JSON must match this structure:
{
  "readinessScore": number,
  "coachingTip": "string"
}
`;

    const userPrompt = `
Calculate the exam readiness score based on this data:
- Hours Studied: ${input.hoursStudied}
- Subject: ${input.subject}
- Study Consistency: ${input.consistency}
- Quizzes Solved: ${input.quizzesSolved}
- Exam Deadline: ${input.deadlineProximity}
`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    let jsonText = result.choices[0].message.content || "{}";
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("JSON parse error:", jsonText);
      throw new Error("Groq returned invalid JSON for readiness score.");
    }

    // Fallbacks to ensure schema is met
    parsed.readinessScore = Math.max(0, Math.min(100, Number(parsed.readinessScore ?? 75)));
    parsed.coachingTip = parsed.coachingTip || "Keep up the consistent effort. You're on the right track!";

    return ExamReadinessOutputSchema.parse(parsed);
  }
);
