'use server';

/**
 * @fileOverview A smart study plan generator AI agent.
 *
 * - generateStudyPlan - A function that handles the study plan generation process.
 * - GenerateStudyPlanInput - The input type for the generateStudyPlan function.
 * - GenerateStudyPlanOutput - The return type for the generateStudyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

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

const prompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  input: {schema: GenerateStudyPlanInputSchema},
  output: {schema: GenerateStudyPlanOutputSchema},
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `You are an AI study plan generator. You will receive information about a student's profile, tasks, free time, and study goals, and you will generate a personalized study plan.

Student Profile:
Grade Level: {{{profile.gradeLevel}}}
Subjects: {{#each profile.subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Exam Dates: {{#if profile.examDates}}{{#each profile.examDates}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
Weekly Free Hours: {{{profile.weeklyFreeHours}}}

Tasks:
{{#each tasks}}{{{this}}}{{#unless @last}}\n{{/unless}}{{/each}}

Free Time Slots:
{{#each freeHours}}{{{this}}}{{#unless @last}}\n{{/unless}}{{/each}}

Study Goals:
{{{studyGoals}}}


Generate a personalized study plan with daily sessions, subject priorities (high, medium, low), and estimated time for each session. Also, provide a 7-day timetable outlining the study plan.

Output:
{{output}}`,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
