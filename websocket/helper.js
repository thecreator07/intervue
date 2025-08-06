const { WebSocket } = require('ws');
// const { Role } = require('./types');
const dotenv = require('dotenv');
const fs = require('fs');
// const { TextToSpeechClient } = require('@google-cloud/text-to-speech').v1;
dotenv.config();

const OpenAI = require('openai').OpenAI;

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.BASE_URL,
});

// // (in helper.js or speak-tts.js)
// process.env.GOOGLE_APPLICATION_CREDENTIALS='websocket/text-to-speech-467917-67fb31ad2152.json';
// const ttsClient = new TextToSpeechClient();

// export async function aiTextWithTTS(ws, history) {
//   // 1. Initialize TTS stream
//   const ttsStream = await ttsClient.streamingSynthesize();

//   // Send config packet first (required: streamingConfig only)
//   ttsStream.write({
//     streamingConfig: {
//       voice: { languageCode: "en-IN", name: "en-IN‑Chirp3‑HD‑Dhanvi" },
//       streamingAudioConfig: { audioEncoding: "LINEAR16" },
//     },
//   });

//   let assistantText = "";

//   // 2. Request Gemini streaming
//   const respStream = await openai.chat.completions.create({
//     model: "gemini-2.0-flash",
//     messages: history,
//     max_tokens: 500,   // tokens per turn
//     stream: true,
//   });

//   for await (const part of respStream) {
//     const delta = part.choices[0].delta?.content;
//     if (!delta) continue;

//     assistantText += delta;
//     ws.send(JSON.stringify({ type: "assistant-text", chunk: delta }));
//     ttsStream.write({ input: { text: delta } });
//   }

//   // Signal end of LLM
//   ws.send(JSON.stringify({ type: "assistant-text", chunk: "[DONE]" }));
//   ttsStream.end();

//   // 3. Relay TTS audio to client
//   const sendAudio = (buf) => ws.send(buf, { binary: true });

//   ttsStream.on("data", (resp) => {
//     if (!resp.audioContent) return;
//     const pcm = Buffer.from(resp.audioContent, "base64"); // headerless LINEAR16 @ 24000 Hz
//     sendAudio(pcm);
//   });

//   return new Promise((resolve) => {
//     ttsStream.on("end", () => resolve(assistantText));
//     ttsStream.on("error", (err) => {
//       console.error("TTS error:", err);
//       ws.send(JSON.stringify({ type: "audio-error", message: err.message }));
//       resolve(assistantText);
//     });
//   });
// }






// async function getAIResponseStream(sessionMessages, ws) {
//   try {
//     const stream = await client.chat.completions.create({
//       model: 'gemini-2.0-flash',
//       messages: sessionMessages,
//       max_tokens: 100,
//       stream: true,
//     });

//     let assembled = '';
//     for await (const chunk of stream) {
//       const delta = chunk.choices[0].delta?.content;
//       if (delta) {
//         ws.send(delta);
//         assembled += delta;
//       }
//     }

//     ws.send('[DONE]');
//     return assembled;
//   } catch (err) {
//     console.error('Streaming error:', err);
//     ws.send("😭 Sorry, something went wrong.");
//     return "";
//   }
// }
const textToSpeech = require('@google-cloud/text-to-speech');
// const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'text-to-speech-467917-67fb31ad2152.json';
// const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const ttsClient = new textToSpeech.TextToSpeechClient({
  credentials: {
    client_email: process.env.CLIENT_EMAIL,
    private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  projectId: process.env.PROJECT_ID,
});

// console.log(process.env.PROJECT_ID, process.env.CLIENT_EMAIL, process.env.PRIVATE_KEY);
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
        // Send text chunk to client
        ws.send(JSON.stringify({ type: 'text', data: delta }));
        assembled += delta;
      }
    }

    // Tell client that streaming is done
    ws.send(JSON.stringify({ type: 'text', data: '[DONE]' }));

    // ⏺️ Synthesize TTS
    const [ttsResponse] = await ttsClient.synthesizeSpeech({
      input: { text: assembled },
      voice: {name:'en-IN-Chirp3-HD-Kore', languageCode: 'en-IN',ssmlGender:'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' },
    });

    // Send audio as binary buffer
    ws.send(ttsResponse.audioContent, { binary: true });

    return assembled;
  } catch (err) {
    console.error('Streaming error:', err);
    ws.send(JSON.stringify({ type: 'error', data: "😭 Sorry, something went wrong." }));
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
  // aiTextWithTTS,
  startPingCheck,
  startSessionTimeout,
  convertMessagesToQA,
};
