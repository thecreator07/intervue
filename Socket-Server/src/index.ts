import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { convertMessagesToQA, getAIResponseStream, startPingCheck, startSessionTimeout } from "./helper";
import { Message } from "./types";
import { parse } from "url";
const port = 5000;
const server = http.createServer();
const wss = new WebSocketServer({ server });
const sessions = new Map<string, Message[]>();
const readySessions = new Set<string>(); // <-- Track if context is loaded

wss.on("connection", (ws: WebSocket, req) => {
  const { query } = parse(req.url || "", true);
  const sessionId = (query?.["session"] as string) || crypto.randomUUID();

  const PingCheck = startPingCheck(ws as WebSocket & { isAlive: boolean });
  const sessiontimeout = startSessionTimeout(ws, 10);

  sessions.set(sessionId, []);

  // Async fetch context
  (async () => {
    try {
      const apiUrl = `http://localhost:3000/api/session/context?sessionId=${sessionId}`;
      const res = await fetch(apiUrl, { method: "GET" });

      if (res.ok) {
        const data = await res.json();

        if (data?.context) {
          // Prevent adding system prompt twice
          const history = sessions.get(sessionId) ?? [];
          const hasSystemPrompt = history.some(msg => msg.role === "system");
          if (!hasSystemPrompt) {
            history.push({
              role: "system",
              content: `You are an AI assistant acting as an expert interviewer. Based on the provided content: ${data.context}, you will ask relevant interview questions.

1. Ask one interview question at a time related to the provided content.
2. Wait for the user's answer

Rules:
- always start interview with introduction question.
- if user answer is not related to question, you have to ask question again.
- ask medium to high level question with whole content context.
- Ask question every time unless 5 questions have been asked.
- end the interview with a closing greeting.
`
            });
            sessions.set(sessionId, history);

            // ✅ System prompt added successfully
            readySessions.add(sessionId);
            ws.send("__INTERVIEW_READY__");
          }

        }
      } else {
        console.error("Failed to fetch context:", await res.text());
      }
    } catch (err) {
      console.error("Error fetching context:", err);
    }
  })();

  console.log(`Client connected with session ID: ${sessionId}`);

  ws.on("message", async (message: string | Buffer) => {
    const msg = message.toString();

    if (!readySessions.has(sessionId)) {
      ws.send("System context not loaded yet.");
      return;
    }

    const history = sessions.get(sessionId) ?? [];
    history.push({ role: "user", content: msg || "start" });

    const aiReply = await getAIResponseStream(history, ws);

    history.push({ role: "assistant", content: aiReply || "" });
    console.log(history)
    sessions.set(sessionId, history);
  });

  ws.on("close", async () => {
    const history = sessions.get(sessionId) ?? [];
    const messages = convertMessagesToQA(history);

    try {
      const response = await fetch("http://localhost:3000/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, conversation: messages }),
      });

      if (!response.ok) {
        console.error("❌ Failed to insert conversation:", await response.text());
      } else {
        console.log("✅ Conversation saved to database.");
      }
    } catch (error) {
      console.error("❌ Error sending conversation to API:", error);
    } finally {
      clearInterval(PingCheck);
      clearTimeout(sessiontimeout);
      sessions.delete(sessionId);
      readySessions.delete(sessionId); // ✅ cleanup
      console.log(`🔌 Session ${sessionId} closed and cleaned up.`);
    }
  });
});

server.listen(port, () => {
  console.log(`✅ WebSocket server running at ws://localhost:${port}`);
});
