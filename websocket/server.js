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
    // aiTextWithTTS,
} = require("./helper");

const port = process.env.PORT;
const server = http.createServer();
const wss = new WebSocketServer({ server });
// const BASE_API_URL = process.env.API_URL || "https://intervue-eta.vercel.app/";
BASE_API_URL = "http://localhost:3000"
const sessions = new Map();
const sessionStates = new Map(); // Track session loading states

wss.on("connection", (ws, req) => {
    const { query } = parse(req.url || "", true);
    const sessionId = query?.["session"] || crypto.randomUUID();

    // Initialize session with loading state
    sessions.set(sessionId, []);
    const sessionState = {
        status: 'connecting',
        pingCheck: startPingCheck(ws),
        timeout: startSessionTimeout(ws, 10) // Longer timeout for initial setup
    };
    sessionStates.set(sessionId, sessionState);

    ws.send(JSON.stringify({
        type: 'status',
        data: 'CONNECTING'
    }));

    // Load context asynchronously without blocking
    loadContext(sessionId)
        .then(context => {
            const history = sessions.get(sessionId) || [];
            
            sessions.set(sessionId, history);

            sessionState.status = 'ready';
            sessionStates.set(sessionId, sessionState);

            ws.send(JSON.stringify({
                type: 'text',
                data: "__INTERVIEW_READY__"
            }));
        })
        .catch(error => {
            console.error("Context loading failed:", error);
            sessionState.status = 'error';
            ws.send(JSON.stringify({
                type: 'error',
                data: 'CONTEXT_LOAD_FAILED'
            }));
            // Don't close connection - let client decide
        });

    ws.on("message", async (message) => {
        const msg = message.toString();
        const state = sessionStates.get(sessionId);
        if (!state || state.status !== 'ready') {
            ws.send(JSON.stringify({
                type: 'error',
                data: 'SERVER_NOT_READY'
            }));
            return;
        }
        // console.log(history)
        try {
            const history = sessions.get(sessionId);
            // console.log("history", history);
            history.push({ role: "user", content: msg || "start" });

            const aiReply = await getAIResponseStream(history, ws);
            history.push({ role: "assistant", content: aiReply || "" });
            sessions.set(sessionId, history);
        } catch (error) {
            console.error("Error processing message:", error);
            ws.send(JSON.stringify({
                type: 'error',
                data: "Error processing your message. Please try again."
            }));
        }
    });

    ws.on("close", async () => {
        const state = sessionStates.get(sessionId);
        if (state) {
            clearInterval(state.pingCheck);
            clearTimeout(state.timeout);
        }

        try {
            const history = sessions.get(sessionId) ?? [];
            if (history.length > 0) {
                const messages = convertMessagesToQA(history);
                await axios.post(`${BASE_API_URL}/api/conversation`, {
                    sessionId,
                    conversation: messages,
                });
                console.log(`✅ Conversation saved for session ${sessionId}`);
            }
        } catch (error) {
            console.error("Error saving conversation:", error.message || error);
        } finally {
            sessions.delete(sessionId);
            sessionStates.delete(sessionId);
            console.log(`🔌 Session ${sessionId} closed`);
        }
    });
});

async function loadContext(sessionId, ws) {
    try {
        const apiUrl = `${BASE_API_URL}/api/session/context?sessionId=${sessionId}`;
        const res = await axios.get(apiUrl);
        const data = res.data;

        if (!data?.context) {
            throw new Error("No context received from API");
        }
// console.log("context",data.context);
        const history = sessions.get(sessionId);
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

        sessions.set(sessionId, history);
        return true;
    } catch (error) {
        console.error("Context loading error:", error);
        throw error;
    }
}

server.listen(port, () => {
    console.log(`✅ WebSocket server running at ws://localhost:${port}`);
});