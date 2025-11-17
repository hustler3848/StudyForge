
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Schemas for generating a question
const GenerateQuestionOutputSchema = z.object({
  question: z.string().describe("A concise and clear question relevant to the topic."),
});
export type GenerateQuestionOutput = z.infer<typeof GenerateQuestionOutputSchema>;

// Schemas for evaluating an answer
const EvaluateAnswerInputSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
export type EvaluateAnswerInput = z.infer<typeof EvaluateAnswerInputSchema>;

const EvaluateAnswerOutputSchema = z.object({
  isCorrect: z.boolean(),
  feedback: z.string().describe("A brief explanation of why the answer is correct or incorrect."),
});
export type EvaluateAnswerOutput = z.infer<typeof EvaluateAnswerOutputSchema>;


/**
 * Generates a challenge question for a given topic and grade level.
 */
export async function generateChallengeQuestion(topic: string, gradeLevel: string): Promise<GenerateQuestionOutput> {
  const systemPrompt = `
You are an AI that creates educational challenge questions.
Generate one question about the provided topic, tailored for the user's specified grade level.
The question should be clear, concise, and suitable for a daily challenge.
Return ONLY VALID JSON with a "question" field.

Example:
{
  "question": "What is the time complexity of a binary search algorithm?"
}
`;

  const userPrompt = `
Topic: ${topic}
Grade Level: ${gradeLevel}
`;

  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const jsonText = result.choices[0].message.content || '{"question": "Could not generate a question. Please try again."}';
  const parsed = JSON.parse(jsonText);
  return GenerateQuestionOutputSchema.parse(parsed);
}


/**
 * Evaluates a user's answer to a given question.
 */
export async function evaluateChallengeAnswer(input: EvaluateAnswerInput): Promise<EvaluateAnswerOutput> {
  const systemPrompt = `
You are an AI that evaluates a user's answer to a question.
Determine if the answer is correct.
Provide brief, encouraging feedback explaining why it's right or wrong.
Return ONLY VALID JSON with "isCorrect" (boolean) and "feedback" (string) fields.

Example for a correct answer:
{
  "isCorrect": true,
  "feedback": "That's correct! You've accurately described the logarithmic time complexity."
}

Example for an incorrect answer:
{
  "isCorrect": false,
  "feedback": "Not quite. While that complexity applies to some algorithms, binary search is more efficient. Think about how the search space is divided."
}
`;

    const userPrompt = `
Question: "${input.question}"
User's Answer: "${input.answer}"
`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    const jsonText = result.choices[0].message.content || '{"isCorrect": false, "feedback": "The AI could not evaluate your answer."}';
    const parsed = JSON.parse(jsonText);
    return EvaluateAnswerOutputSchema.parse(parsed);
}
