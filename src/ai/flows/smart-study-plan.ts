'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// SCHEMAS
const GenerateStudyPlanInputSchema = z.object({
  profile: z.object({
    gradeLevel: z.string(),
    subjects: z.array(z.string()),
    examDates: z.array(z.string()).optional(),
    weeklyFreeHours: z.number(),
  }),
  tasks: z.array(z.string()),
  freeHours: z.array(z.string()),
  studyGoals: z.string(),
});

export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

const GenerateStudyPlanOutputSchema = z.object({
  dailySessions: z.array(
    z.object({
      subject: z.string(),
      priority: z.string(),
      estimatedTime: z.string(),
    })
  ),
  weeklyTimetable: z.string(),
});

export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

// MAIN FUNCTION
export async function generateStudyPlan(input: GenerateStudyPlanInput) {
  return generateStudyPlanFlow(input);
}

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {

    const systemPrompt = `
You generate study plans in STRICT JSON ONLY.
You MUST ALWAYS return all required fields:
- dailySessions[] must contain "subject", "priority", "estimatedTime"
- weeklyTimetable must be a string

If unsure, make up reasonable values. NEVER leave fields empty or undefined.
Return ONLY valid JSON WITHOUT markdown or commentary.

The JSON must match exactly this shape:
{
  "dailySessions": [
    {
      "subject": "string",
      "priority": "high | medium | low",
      "estimatedTime": "string"
    }
  ],
  "weeklyTimetable": "string"
}
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
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    let jsonText = result.choices[0].message.content || "{}";

    // Remove accidental code fences
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("JSON parse error:", jsonText);
      throw new Error("Groq returned invalid JSON.");
    }

    // 🛡 FIX: Fill missing fields (Groq sometimes forgets)
    if (Array.isArray(parsed.dailySessions)) {
      parsed.dailySessions = parsed.dailySessions.map((s: any) => ({
        subject: s.subject || "General Study",
        priority: s.priority || "medium",
        estimatedTime: s.estimatedTime || "1 hour",
      }));
    }

    parsed.weeklyTimetable = parsed.weeklyTimetable || "Timetable unavailable";

    // ZOD VALIDATION
    return GenerateStudyPlanOutputSchema.parse(parsed);
  }
);
