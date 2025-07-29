import { OpenAI } from 'openai';
import { Message, Messagedata } from "./types";
import { WebSocket as WsWebSocket } from 'ws';
import dotenv from 'dotenv';
dotenv.config();


const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.BASE_URL,
});

export async function getAIResponseStream(sessionMessages: Message[], ws: WsWebSocket) {
  try {
    const stream = await client.chat.completions.create({
      model: 'gemini-2.0-flash',
      messages: sessionMessages,
      max_tokens: 100,
      stream: true,
    });

    let assembled = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta?.content;
      if (delta) {
        ws.send(delta);
        assembled += delta;
      }
    }
    ws.send('[DONE]')
    return assembled;
  } catch (err) {
    console.error('Streaming error:', err);
    ws.send("😭 Sorry, something went wrong.");
    return "";
  }
}

type WsWithAlive = WsWebSocket & { isAlive: boolean };
export function startPingCheck(ws: WsWithAlive) {

  // When the client replies with "pong", mark it as alive
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  // Set an interval to check connection status every 30 seconds
  const interval = setInterval(() => {
      if (!ws.isAlive) {
      console.log("🛑 Client is unresponsive. Terminating...");
      clearInterval(interval); // stop the interval
      ws.terminate();          
      return;
    }    
    ws.isAlive = false;
    ws.ping(); 
  }, 30000); // 30 seconds

  return interval;
}

export function startSessionTimeout(ws: WsWebSocket, sessionTime: number = 10) {
  const sessionTimer = setTimeout(() => {
    ws.send(`⏱️ ${sessionTime}-minute session ended. Goodbye!`);
    ws.close(1000, "Session ended");
  }, sessionTime * 60 * 1000);
  return sessionTimer;
}



export function convertMessagesToQA(conversation: Message[]): { question: string, answer: string }[] {
  const pairs: { question: string, answer: string }[] = [];

  for (let i = 0; i < conversation.length - 1; i++) {
    const current = conversation[i];
    const next = conversation[i + 1];

    if (current.role === "assistant" && next.role === "user") {
      pairs.push({ question: current.content, answer: next.content });
    }    
  }

  return pairs;
}