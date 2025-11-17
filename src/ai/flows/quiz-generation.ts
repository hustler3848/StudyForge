'use server';

/**
 * @fileOverview AI-powered quiz generator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// INPUT SCHEMA
const GenerateQuizInputSchema = z.object({
  topic: z.string().describe("The subject or topic for the quiz, e.g., 'Physics, Chapter 5: Thermodynamics'"),
  numberOfQuestions: z.coerce.number().min(3).max(10).default(5),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Any']).default('Any'),
  questionType: z.enum(['Theoretical', 'Numerical', 'Any']).default('Any'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// OUTPUT SCHEMA
const GenerateQuizOutputSchema = z.object({
  questions: z.array(
    z.object({
      questionText: z.string(),
      options: z.array(z.string()).min(4),
      correctAnswerIndex: z.number().min(0),
      explanation: z.string().describe("A brief explanation of why the correct answer is right."),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
    })
  ).min(1),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


// EXPORTED FUNCTION
export async function generateQuiz(
  input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

// GENKIT FLOW
const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const systemPrompt = `
You are an AI that generates educational multiple-choice quizzes.
Your task is to create a quiz based on the user-provided topic and constraints.

RULES:
- Return ONLY VALID JSON, no markdown or commentary.
- The JSON object must contain a single key: "questions".
- "questions" must be an array of EXACTLY ${input.numberOfQuestions} question objects.
- Each question object MUST have the following fields:
  - "questionText": The question itself (string).
  - "options": An array of at least 4 possible answers (string[]).
  - "correctAnswerIndex": The index (0-3) of the correct answer in the "options" array (number).
  - "explanation": A concise reason why the correct answer is right (string).
  - "difficulty": The question's difficulty, must be one of "Easy", "Medium", or "Hard" (string). If the user requested 'Any', you can mix difficulties.
- Ensure all fields are populated and valid.
- The questions should be relevant to the provided topic, difficulty, and type.

The JSON output MUST STRICTLY follow this structure:
{
  "questions": [
    {
      "questionText": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswerIndex": 0,
      "explanation": "...",
      "difficulty": "Easy"
    },
    ... (${input.numberOfQuestions - 1} more questions)
  ]
}
`;

    const userPrompt = `
Generate a quiz with the following properties:
- Topic: "${input.topic}"
- Number of Questions: ${input.numberOfQuestions}
- Difficulty: ${input.difficulty}
- Question Type: ${input.questionType}
`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    let jsonText = result.choices[0].message.content || '{"questions": []}';
    
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("JSON parse error in quiz generation:", jsonText);
      throw new Error("The AI returned invalid JSON. Please try again.");
    }
    
    // Basic validation and fallback
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error(`AI failed to generate a valid quiz with ${input.numberOfQuestions} questions.`);
    }

    return GenerateQuizOutputSchema.parse(parsed);
  }
);
