import { OpenAI } from 'openai';
import { OPENAI_CONFIG } from '../config/openai';

export function createOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: OPENAI_CONFIG.API_KEY,
    baseURL: OPENAI_CONFIG.BASE_URL,
  });
}

export const openaiClient = createOpenAIClient();
