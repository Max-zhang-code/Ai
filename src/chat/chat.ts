/// <reference types="node" />
import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';
import readlineSync from 'readline-sync';

dotenv.config();

// 初始化 DeepSeek（兼容 OpenAI SDK）
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1', // DeepSeek 的 baseURL
});

type ChatRole = 'system' | 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

let messages: ChatMessage[] = [
  {
    role: 'system',
    content:
      '你是一个聪明、幽默的前端+Node.js全栈工程师，帮用户解决问题，用中文回复。',
  },
]; // 系统提示 + 对话历史

async function chat() {
  while (true) {
    const userInput = readlineSync.question('\n你: ');
    if (userInput.toLowerCase() === 'exit' || userInput === '退出') break;

    messages.push({ role: 'user', content: userInput });

    try {
      const stream = await openai.chat.completions.create({
        model: 'deepseek-chat', // 或 'deepseek-coder' 如果想偏代码
        messages: messages as any, // 简化类型
        stream: true, // 开启流式输出，像 ChatGPT 那样实时打字
        temperature: 0.7,
      });

      process.stdout.write('AI: ');
      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          process.stdout.write(content);
          fullResponse += content;
        }
      }
      console.log('\n'); // 换行

      messages.push({ role: 'assistant', content: fullResponse });
    } catch (error: any) {
      console.error('出错了:', error.message);
    }
  }
  console.log('聊天结束，拜拜~');
}

chat();
