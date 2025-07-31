const { WebSocket } = require('ws');
// const { Role } = require('./types');
const dotenv = require('dotenv');
dotenv.config();

const OpenAI = require('openai').OpenAI;

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.BASE_URL,
});

async function getAIResponseStream(sessionMessages, ws) {
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

    ws.send('[DONE]');
    return assembled;
  } catch (err) {
    console.error('Streaming error:', err);
    ws.send("😭 Sorry, something went wrong.");
    return "";
  }
}

function startPingCheck(ws) {
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  const interval = setInterval(() => {
    if (!ws.isAlive) {
      console.log("🛑 Client is unresponsive. Terminating...");
      clearInterval(interval);
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  }, 30000);

  return interval;
}

function startSessionTimeout(ws, sessionTime = 10) {
  const sessionTimer = setTimeout(() => {
    ws.send(`⏱️ ${sessionTime}-minute session ended. Goodbye!`);
    ws.close(1000, "Session ended");
  }, sessionTime * 60 * 1000);
  return sessionTimer;
}

function convertMessagesToQA(conversation) {
  const pairs = [];
  for (let i = 0; i < conversation.length - 1; i++) {
    const current = conversation[i];
    const next = conversation[i + 1];

    if (current.role === "assistant" && next.role === "user") {
      pairs.push({ question: current.content, answer: next.content });
    }
  }
  return pairs;
}

module.exports = {
  getAIResponseStream,
  startPingCheck,
  startSessionTimeout,
  convertMessagesToQA,
};
