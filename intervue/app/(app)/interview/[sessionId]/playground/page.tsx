"use client";
import { connectSocket, sendMessage } from "@/lib/Socket";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import VideoScreen from "../../components/VideoScreen";
import { Button } from "@/components/ui/button";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

export default function ChatPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const aiMessageRef = useRef("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const socketRef = useRef<WebSocket | null>(null); // store socket ref
  const { sessionId } = useParams<{ sessionId: string }>();
  const [playing, setPlaying] = useState(true);
  const router = useRouter();
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(0);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    transcript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      alert("Your browser does not support speech recognition.");
    }
  }, [browserSupportsSpeechRecognition]);
  useEffect(() => {
    if (!transcript) return;

    // Update last speech time whenever transcript changes
    setLastSpeechTime(Date.now());
    console.log(lastSpeechTime, "lastSpeechTime");
    // Clear any existing timeout
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
    }

    // Set new timeout to send after 5 seconds of silence
    sendTimeoutRef.current = setTimeout(() => {
      if (input.trim() && !streaming) {
        handleSend();
      }
    }, 2000); // 5 seconds

    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
    };
  }, [transcript]);
  useEffect(() => {
    const socket = connectSocket(sessionId);
    socketRef.current = socket;

    socket.binaryType = "arraybuffer";

    socket.onmessage = (event) => {
      if (typeof event.data === "string") {
        console.log("eventdata", event.type, event.data);
        try {
          const msg = JSON.parse(event.data);
          console.log("message", msg);
          if (msg.type === "text") {
            const chunk = msg.data;

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
                if (
                  prev.length === 0 ||
                  prev[prev.length - 1].startsWith("🧑‍💻")
                ) {
                  return [...prev, aiMessageRef.current];
                } else {
                  const updated = [...prev];
                  updated[updated.length - 1] = aiMessageRef.current;
                  return updated;
                }
              });
            }
          } else if (msg.type === "error") {
            console.error("LLM Error:", msg.data);
          }
        } catch (err: unknown) {
          console.warn(
            "Non-JSON message:",
            err instanceof Error ? event.data : err
          );
        }
      } else {
        console.log(messages[messages.length - 1]);
        console.log("Received binary", event.data.byteLength);
        const blob = new Blob([event.data], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(blob);

        // Stop speech recognition before playing audio
        SpeechRecognition.stopListening().catch((err: unknown) =>
          console.error(
            "Error stopping recognition:",
            err instanceof Error ? err.message : err
          )
        );

        // Initialize or update audio element
        if (!audioRef.current) {
          audioRef.current = new Audio(audioUrl);
        } else {
          audioRef.current.src = audioUrl;
        }

        // Clean up previous event listeners to avoid duplicates
        audioRef.current.onended = null;
        audioRef.current.onerror = null;

        // Set up new event listeners
        audioRef.current.onended = () => {
          console.log("Audio playback finished");
          if (!streaming) {
            SpeechRecognition.startListening({ continuous: true }).catch(
              (err: unknown) =>
                console.error(
                  "Error starting recognition:",
                  err instanceof Error ? err.message : err
                )
            );
          }
        };

        audioRef.current.onerror = (error: unknown) => {
          console.error(
            "Audio playback error:",
            error instanceof Error ? error.message : error
          );
          if (!streaming) {
            SpeechRecognition.startListening({ continuous: true }).catch(
              (err) => console.error("Error starting recognition:", err)
            );
          }
        };

        // Play the audio
        audioRef.current
          .play()
          .catch((err: unknown) =>
            console.error(
              "Audio play failed:",
              err instanceof Error ? err.message : err
            )
          );
      }
    };

    socket.onclose = () => {
      setStreaming(false);
      setPlaying(false);
      console.log("🔌 Socket closed");
      SpeechRecognition.stopListening();
      // router.push("/interview");
    };

    return () => socket.close();
  }, [sessionId]);
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;

    const manageRecognition = async () => {
      if (streaming) {
        try {
          await SpeechRecognition.stopListening();
          console.log("🛑 Stopped listening (AI is speaking)");
        } catch (err) {
          console.error("Error stopping recognition:", err);
        }
      } else if (!listening) {
        try {
          await SpeechRecognition.startListening({ continuous: true });
          console.log("🎙️ Started listening (AI finished speaking)");
        } catch (err: unknown) {
          console.error(
            "Error starting recognition:",
            err instanceof Error ? err.message : err
          );
        }
      }
    };

    manageRecognition();
  }, [streaming, browserSupportsSpeechRecognition, listening]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Clear any pending auto-send
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
    }

    setMessages((prev) => [...prev, `🧑‍💻 ${input}`]);
    sendMessage(input);
    setInput("");
    setStreaming(false);
    SpeechRecognition.stopListening();
    resetTranscript();
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (transcript && !streaming && transcript !== input) {
        setInput(transcript);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [transcript, streaming, input]);
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

        <Button>{listening ? "Listening" : "Stop"}</Button>
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
          {/* <p>{transcript}</p> */}
        </div>
        <input
          name="input"
          value={transcript || input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Write Your Message..."
          className="mt-4 border p-2 rounded"
        />
      </section>
    </div>
  );
}
