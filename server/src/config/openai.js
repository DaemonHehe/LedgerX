import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn('WARNING: OPENAI_API_KEY is not defined. Template analysis features will be unavailable.');
}

export const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;
