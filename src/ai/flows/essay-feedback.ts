'use server';

/**
 * @fileOverview AI-powered essay feedback generator using Groq.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// INPUT SCHEMA
const AnalyzeEssayInputSchema = z.object({
  text: z.string(),
});
export type AnalyzeEssayInput = z.infer<typeof AnalyzeEssayInputSchema>;

// OUTPUT SCHEMA
const AnalyzeEssayOutputSchema = z.object({
  grammarScore: z.number(),
  readabilityScore: z.number(),
  claritySuggestions: z.string(),
  structuralSuggestions: z.string(),
  toneAnalysis: z.string(),
  correctedRewrite: z.string().optional(),
});
export type AnalyzeEssayOutput = z.infer<typeof AnalyzeEssayOutputSchema>;

// EXPORT
export async function analyzeEssay(
  input: AnalyzeEssayInput
): Promise<AnalyzeEssayOutput> {
  return analyzeEssayFlow(input);
}

// FLOW
const analyzeEssayFlow = ai.defineFlow(
  {
    name: 'analyzeEssayFlow',
    inputSchema: AnalyzeEssayInputSchema,
    outputSchema: AnalyzeEssayOutputSchema,
  },
  async (input) => {
    const systemPrompt = `
You are an AI essay feedback assistant.

Return ONLY VALID JSON — no markdown, no commentary.

The JSON MUST include:
- grammarScore (0-100)
- readabilityScore (number)
- claritySuggestions (string)
- structuralSuggestions (string)
- toneAnalysis (string)
- correctedRewrite (string)

NEVER leave a field blank. If unsure, generate a reasonable value.

The JSON must match this structure:
{
  "grammarScore": number,
  "readabilityScore": number,
  "claritySuggestions": "string",
  "structuralSuggestions": "string",
  "toneAnalysis": "string",
  "correctedRewrite": "string"
}
`;

    const userPrompt = `Essay:\n${input.text}`;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    let jsonText = result.choices[0].message.content || "{}";

    // Strip accidental ```json fences
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("JSON parse error:", jsonText);
      throw new Error("Groq returned invalid JSON.");
    }

    // 🛡 Fallback: Make sure all fields exist & are safe
    parsed.grammarScore = Number(parsed.grammarScore ?? 80);
    parsed.readabilityScore = Number(parsed.readabilityScore ?? 70);

    parsed.claritySuggestions =
      parsed.claritySuggestions ||
      "Try breaking long sentences and clarifying ambiguous ideas.";

    parsed.structuralSuggestions =
      parsed.structuralSuggestions ||
      "Organize paragraphs with clear topic sentences and logical flow.";

    parsed.toneAnalysis =
      parsed.toneAnalysis ||
      "The tone is mostly clear and informative, but could be more engaging.";

    parsed.correctedRewrite =
      parsed.correctedRewrite ||
      "A corrected version of the essay could not be generated.";

    // Validate with Zod
    return AnalyzeEssayOutputSchema.parse(parsed);
  }
);
