const { WebSocketServer } = require("ws");
const http = require("http");
const { parse } = require("url");
const crypto = require("crypto");
const axios = require("axios");
const dotenv = require('dotenv');
dotenv.config();

const {
    convertMessagesToQA,
    getAIResponseStream,
    startPingCheck,
    startSessionTimeout,
    aiTextWithTTS,
} = require("./helper");

const port = process.env.PORT
const server = http.createServer();
const wss = new WebSocketServer({ server });
// const BASE_API_URL = process.env.API_URL || "https://intervue-eta.vercel.app/";
BASE_API_URL = "http://localhost:3000"
const sessions = new Map();
const readySessions = new Set();

wss.on("connection", async (ws, req) => {
    const { query } = parse(req.url || "", true);
    const sessionId = query?.["session"] || crypto.randomUUID();

    const PingCheck = startPingCheck(ws);
    const sessionTimeout = startSessionTimeout(ws, 10);

    // Ensure the session is initialized before any async call
    sessions.set(sessionId, []);
    // console.log(`Client connected with session ID: ${sessionId}`);
    (async () => {


        try {
            const apiUrl = `${BASE_API_URL}/api/session/context?sessionId=${sessionId}`;
            const res = await axios.get(apiUrl);
            const data = res.data;
            // console.log(data)
            if (!data?.context) {
                ws.send(JSON.stringify({ type: 'error', data: "Failed to load context. Closing connection." }));
                // ws.close();
                return;
            }

            // Fetch again after async (sessions could've been cleared)
            const history = sessions.get(sessionId);
            if (!history) {
                console.error("Session history not found after context fetch.");
                ws.send(JSON.stringify({ type: 'error', data: "Session error. Closing connection." }));
                // ws.close();
                return;
            }
            // console.log(history);
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
            - use single paragraph or sentence for your question.
            - don't use special characters like "\n"
`
            });

            sessions.set(sessionId, history); console.log(history)
            readySessions.add(sessionId);
            ws.send(JSON.stringify({ type: 'text', data: "__INTERVIEW_READY__" }));

        } catch (error) {
            console.error("Failed to fetch context:", error.message || error);
            ws.send(JSON.stringify({ type: 'error', data: "Failed to fetch context. Closing connection." }));
            ws.close();
            return;
        }

    })()
    // Message handler here...

    // Message handler after context is successfully loaded
    ws.on("message", async (message) => {
        const msg = message.toString();

        if (!readySessions.has(sessionId)) {
            ws.send(JSON.stringify({ type: 'text', data: "⚠️ System context not yet loaded. Please wait." }));
            return;
        }

        const history = sessions.get(sessionId);
        // console.log(history)
        history.push({ role: "user", content: msg || "start" });

        const aiReply = await getAIResponseStream(history, ws);
        // const aiReply = await aiTextWithTTS(ws,history);
        // console.log(aiReply)
        history.push({ role: "assistant", content: aiReply || "" });
        sessions.set(sessionId, history);
    });

    ws.on("close", async () => {
        const history = sessions.get(sessionId) ?? [];
        const messages = convertMessagesToQA(history);

        try {
            const response = await axios.post(`${BASE_API_URL}/api/conversation`, {
                sessionId,
                conversation: messages,
            });

            console.log("✅ Conversation saved to database.");
        } catch (error) {
            console.error("Error sending conversation to API:", error.message || error);
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
