const { WebSocketServer } = require("ws");
const http = require("http");
const { parse } = require("url");
const crypto = require("crypto");
const axios = require("axios");

const {
    convertMessagesToQA,
    getAIResponseStream,
    startPingCheck,
    startSessionTimeout,
} = require("./helper");

const port = 5000;
const server = http.createServer();
const wss = new WebSocketServer({ server });

const sessions = new Map();
const readySessions = new Set();

wss.on("connection", async (ws, req) => {
    const { query } = parse(req.url || "", true);
    const sessionId = query?.["session"] || crypto.randomUUID();

    const PingCheck = startPingCheck(ws);
    const sessionTimeout = startSessionTimeout(ws, 10);

    // Ensure the session is initialized before any async call
    sessions.set(sessionId, []);
    console.log(`Client connected with session ID: ${sessionId}`);

    try {
        const apiUrl = `http://localhost:3000/api/session/context?sessionId=${sessionId}`;
        const res = await axios.get(apiUrl);
        const data = res.data;

        if (!data?.context) {
            ws.send("❌ Failed to load context. Closing connection.");
            ws.close();
            return;
        }

        // Fetch again after async (sessions could've been cleared)
        const history = sessions.get(sessionId);
        if (!history) {
            console.error("❌ Session history not found after context fetch.");
            ws.send("❌ Session error. Closing connection.");
            ws.close();
            return;
        }

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
        readySessions.add(sessionId);
        ws.send("__INTERVIEW_READY__");

    } catch (error) {
        console.error("❌ Failed to fetch context:", error.message || error);
        ws.send("❌ Failed to fetch context. Closing connection.");
        ws.close();
        return;
    }

    // Message handler here...

    // Message handler after context is successfully loaded
    ws.on("message", async (message) => {
        const msg = message.toString();

        if (!readySessions.has(sessionId)) {
            ws.send("⚠️ System context not yet loaded. Please wait.");
            return;
        }

        const history = sessions.get(sessionId);
        history.push({ role: "user", content: msg || "start" });

        const aiReply = await getAIResponseStream(history, ws);
        history.push({ role: "assistant", content: aiReply || "" });
        sessions.set(sessionId, history);
    });

    ws.on("close", async () => {
        const history = sessions.get(sessionId) ?? [];
        const messages = convertMessagesToQA(history);

        try {
            const response = await axios.post("http://localhost:3000/api/conversation", {
                sessionId,
                conversation: messages,
            });

            console.log("✅ Conversation saved to database.");
        } catch (error) {
            console.error("❌ Error sending conversation to API:", error.message || error);
        } finally {
            clearInterval(PingCheck);
            clearTimeout(sessionTimeout);
            sessions.delete(sessionId);
            readySessions.delete(sessionId);
            console.log(`🔌 Session ${sessionId} closed and cleaned up.`);
        }
    });
});

server.listen(port, () => {
    console.log(`✅ WebSocket server running at ws://localhost:${port}`);
});
