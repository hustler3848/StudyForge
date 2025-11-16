import { config } from 'dotenv';
config();

import '@/ai/flows/essay-feedback.ts';
import '@/ai/flows/ai-motivation-nudges.ts';
import '@/ai/flows/flashcard-generation.node';
import '@/ai/flows/smart-study-plan.ts';