/// <reference types="node" />
import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import open from 'open';
import { openaiClient } from './services/openaiClient';
import { OPENAI_CONFIG } from './config/openai';
import type { ChatMessage } from './types/chat';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 解析 JSON 请求体
app.use(express.json());

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

    const messages: ChatMessage[] =
      Array.isArray(history) && history.length > 0
        ? history
        : [
            {
              role: 'system',
              content: OPENAI_CONFIG.SYSTEM_PROMPT,
            },
          ];

    messages.push({ role: 'user', content: message });

    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: messages,
      temperature: OPENAI_CONFIG.TEMPERATURE,
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

app.listen(port, async () => {
  const url = `http://localhost:${port}`;
  console.log(`Chat UI is running at ${url}`);

  try {
    await open(url);
  } catch (err) {
    console.log('请手动打开浏览器访问:', url);
  }
});
