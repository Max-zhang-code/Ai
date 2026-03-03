export const OPENAI_CONFIG = {
  API_KEY: 'ollama',
  BASE_URL: 'http://localhost:11434/v1',
  MODEL: 'llama2',
  TEMPERATURE: 0.7,
  MAX_HISTORY_LENGTH: 50,
  SYSTEM_PROMPT: '你是一个聪明、幽默的前端+Node.js全栈工程师，帮用户解决问题，用中文回复。',
} as const;
