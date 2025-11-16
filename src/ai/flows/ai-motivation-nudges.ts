'use server';

import Groq from "groq-sdk";
import { z } from "zod";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MotivationNudgeOutputSchema = z.object({
  message: z.string(),
});

export type MotivationNudgeOutput = z.infer<typeof MotivationNudgeOutputSchema>;

export async function generateMotivationNudge(): Promise<MotivationNudgeOutput> {
  try {
    const systemPrompt = `
You are a motivational coach.
Generate a short encouraging message (max 20 words).
Return ONLY valid JSON like:
{ "message": "text" }
`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = result.choices[0].message?.content ?? "{}";

    const parsed = MotivationNudgeOutputSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      throw new Error("Invalid JSON returned by Groq");
    }

    return parsed.data;
  } catch (err) {
    console.error("GROQ ERROR:", err);

    return {
      message: "Keep pushing — small steps lead to big progress.",
    };
  }
}
