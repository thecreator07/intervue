"use client";
import { connectSocket, sendMessage } from "@/lib/Socket";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import VideoScreen from "../../components/VideoScreen";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const aiMessageRef = useRef("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null); // 👈 store socket ref
  const { sessionId } = useParams<{ sessionId: string }>();
  const [playing, setPlaying] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const socket = connectSocket(sessionId);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const chunk = event.data;

      if (chunk === "__INTERVIEW_READY__") {
        sendMessage("start");
        return;
      }

      if (chunk === "[DONE]") {
        setStreaming(false);
        aiMessageRef.current = "";
      } else {
        setStreaming(true);
        aiMessageRef.current += chunk;
        setMessages((prev) => {
          if (prev.length === 0 || prev[prev.length - 1].startsWith("🧑‍💻")) {
            return [...prev, aiMessageRef.current];
          } else {
            const updated = [...prev];
            updated[updated.length - 1] = aiMessageRef.current;
            return updated;
          }
        });
      }
    };

    socket.onclose = () => {
      setStreaming(false);
      setPlaying(false);
      console.log("🔌 Socket closed");
    };

    return () => socket.close(); // clean up on unmount
  }, [sessionId]);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, `🧑‍💻 ${input}`]);
    sendMessage(input);
    setInput("");
    setStreaming(false);
  };

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.close(); // Triggers `onclose` on server
      setTimeout(() => {
        socketRef.current = null;
        setStreaming(false);
        setPlaying(false);
        console.log("👋 Disconnected by user");
        setMessages([]);
        setPlaying(false);
        router.push("/interview"); // Redirect after cleanup
      }, 100); // give time for ws.onclose
    }
  };

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="grid grid-cols-12 gap-4 min-h-screen p-4 overflow-y-auto hide-scrollbar">
      {/* Sidebar */}
      <aside className="col-span-2 p-4 rounded-md shadow">
        <h2 className="text-xl font-bold">Menu</h2>
        <Button
          onClick={handleDisconnect}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white"
        >
          Disconnect
        </Button>
      </aside>

      {/* Main Screen */}
      <VideoScreen playing={playing} streaming={streaming} />

      {/* Chat */}
      <section className="col-span-4 p-4 rounded shadow flex flex-col h-full">
        <div className="relative flex-1">
          <div
            className="overflow-y-auto p-2 border hide-scrollbar rounded space-y-2"
            style={{ height: "calc(100vh - 125px)" }}
          >
            {messages.map((m, i) => (
              <p key={i} className="whitespace-pre-line">
                {m}
              </p>
            ))}
            <div ref={bottomRef} className="h-2" />
          </div>
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Write Your Message..."
          className="mt-4 border p-2 rounded"
        />
      </section>
    </div>
  );
}
