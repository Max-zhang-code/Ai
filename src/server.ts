/// <reference types="node" />
import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 解析 JSON 请求体
app.use(express.json());

// 初始化 DeepSeek（兼容 OpenAI SDK）
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

// 静态页面（前端聊天界面），dist/server.js 运行时 __dirname 指向 dist
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const messages =
      Array.isArray(history) && history.length > 0
        ? history
        : [
            {
              role: 'system',
              content:
                '你是一个聪明、幽默的前端+Node.js全栈工程师，帮用户解决问题，用中文回复。',
            },
          ];

    messages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages as any,
      temperature: 0.7,
      stream: false,
    });

    const reply = completion.choices[0]?.message?.content ?? '';
    messages.push({ role: 'assistant', content: reply });

    res.json({
      reply,
      history: messages,
    });
  } catch (err: any) {
    console.error('[deepseek-chat 调用失败]', err?.message);
    res.status(err?.status || 500).json({
      error: err?.message || 'Unknown error',
      details: err?.response?.data,
    });
  }
});

app.listen(port, () => {
  console.log(`Chat UI is running at http://localhost:${port}`);
});
