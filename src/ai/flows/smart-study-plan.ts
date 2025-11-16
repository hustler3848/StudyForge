'use server';

/**
 * @fileOverview A smart study plan generator AI agent using Groq.
 *
 * - generateStudyPlan - A function that handles the study plan generation process.
 * - GenerateStudyPlanInput - The input type for the generateStudyPlan function.
 * - GenerateStudyPlanOutput - The return type for the generateStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const GenerateStudyPlanInputSchema = z.object({
  profile: z
    .object({
      gradeLevel: z.string().describe('The grade or class level of the student.'),
      subjects: z.array(z.string()).describe('The subjects the student is studying.'),
      examDates: z.array(z.string()).optional().describe('Optional exam dates.'),
      weeklyFreeHours: z
        .number()
        .describe('The number of free hours the student has per week for studying.'),
    })
    .describe('The profile of the student.'),
  tasks: z
    .array(z.string())
    .describe('A list of upcoming tests and assignments.'),
  freeHours: z.array(z.string()).describe('The available free time slots for studying.'),
  studyGoals: z.string().describe('The study goals of the student.'),
});

export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

const GenerateStudyPlanOutputSchema = z.object({
  dailySessions: z
    .array(
      z.object({
        subject: z.string().describe('The subject to study.'),
        priority: z.string().describe('The priority of the subject (high, medium, low).'),
        estimatedTime: z.string().describe('The estimated time to spend on the subject.'),
      })
    )
    .describe('A list of daily study sessions.'),
  weeklyTimetable: z.string().describe('A 7-day timetable outlining the study plan.'),
});

export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

export async function generateStudyPlan(input: GenerateStudyPlanInput): Promise<GenerateStudyPlanOutput> {
  return generateStudyPlanFlow(input);
}


const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {
    const systemPrompt = `You are an AI study plan generator. You will receive information about a student's profile, tasks, free time, and study goals, and you will generate a personalized study plan.

Generate a personalized study plan with daily sessions, subject priorities (high, medium, low), and estimated time for each session. Also, provide a 7-day timetable outlining the study plan.

You must respond in a valid JSON format. Do not include any markdown or other formatting in your response. The JSON object should conform to the following Zod schema:
${JSON.stringify(GenerateStudyPlanOutputSchema.shape)}
`;

    const userPrompt = `
Student Profile:
Grade Level: ${input.profile.gradeLevel}
Subjects: ${input.profile.subjects.join(', ')}
Exam Dates: ${input.profile.examDates?.join(', ') || 'None'}
Weekly Free Hours: ${input.profile.weeklyFreeHours}

Tasks:
${input.tasks.join('\n')}

Free Time Slots:
${input.freeHours.join('\n')}

Study Goals:
${input.studyGoals}
`;

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
        return GenerateStudyPlanOutputSchema.parse(parsed);
    } catch (e) {
        console.error("Failed to parse AI response:", e);
        throw new Error("The AI returned an invalid response format.");
    }
  }
);
