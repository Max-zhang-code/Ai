/// <reference types="node" />
import * as dotenv from 'dotenv';
import { openaiClient } from '../services/openaiClient';
import { OPENAI_CONFIG } from '../config/openai';
import type { ChatMessage, ChatRole } from '../types/chat';
import readlineSync from 'readline-sync';

dotenv.config();

// 使用自定义消息类型
let messages: ChatMessage[] = [
  {
    role: 'system',
    content: OPENAI_CONFIG.SYSTEM_PROMPT,
  },
];

// 命令处理函数
function handleCommand(input: string): boolean {
  if (input.startsWith('/')) {
    const command = input.slice(1).toLowerCase();

    switch (command) {
      case 'help':
        console.log('\n可用命令:');
        console.log('/help - 显示帮助信息');
        console.log('/clear - 清空对话历史');
        console.log('/history - 显示对话历史长度');
        console.log('/exit 或 退出 - 结束聊天');
        return true;
      case 'clear':
        messages = [
          {
            role: 'system',
            content: OPENAI_CONFIG.SYSTEM_PROMPT,
          },
        ];
        console.log('\n对话历史已清空');
        return true;
      case 'history':
        console.log(`\n当前对话历史长度: ${messages.length - 1} 条消息`);
        return true;
      default:
        console.log(`\n未知命令: ${input}`);
        return true;
    }
  }
  return false;
}

// 限制消息历史长度
function limitHistoryLength() {
  if (messages.length > OPENAI_CONFIG.MAX_HISTORY_LENGTH) {
    // 保留系统提示，移除最旧的用户和助手消息
    messages = [
      messages[0],
      ...messages.slice(-(OPENAI_CONFIG.MAX_HISTORY_LENGTH - 1)),
    ];
  }
}

// 错误处理函数
function handleError(error: any) {
  console.error('\n出错了:');

  if (error.response) {
    // API 返回错误
    console.error(`状态码: ${error.response.status}`);
    console.error(`错误信息: ${error.response.data.error.message}`);
  } else if (error.request) {
    // 请求发送但没有收到响应
    console.error('未收到API响应，请检查网络连接');
  } else {
    // 其他错误
    console.error(`错误: ${error.message}`);
  }
}

async function chat() {
  console.log(
    '欢迎使用 AI 聊天助手！输入 /help 查看可用命令，输入 exit 或 退出 结束聊天。\n',
  );

  while (true) {
    const userInput = readlineSync.question('[You]: ').trim();

    // 检查是否为退出命令
    if (userInput.toLowerCase() === 'exit' || userInput === '退出') break;

    // 检查是否为空输入
    if (!userInput) {
      console.log('请输入内容');
      continue;
    }

    // 处理命令
    if (handleCommand(userInput)) {
      continue;
    }

    // 添加用户消息
    messages.push({ role: 'user', content: userInput });

    try {
      const stream = await openaiClient.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: messages,
        stream: true,
        temperature: OPENAI_CONFIG.TEMPERATURE,
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

      // 添加助手消息
      messages.push({ role: 'assistant', content: fullResponse });

      // 限制消息历史长度
      limitHistoryLength();
    } catch (error) {
      handleError(error);
    }
  }
  console.log('聊天结束，拜拜~');
}

chat();
