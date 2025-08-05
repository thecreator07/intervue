"use client";

import { SessionData } from "@/models/session.model";
import { motion } from "framer-motion";

interface ChatPageProps {
  conversation: SessionData;
}

export default function ChatPage({ conversation }: ChatPageProps) {
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600">
        {conversation.sessionTitle || "Interview Session"}
      </h2>

      <div className="space-y-4">
        {conversation.conversation.map((msg, idx) => (
          <div key={idx} className="flex flex-col gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="self-end max-w-[75%] bg-indigo-100 text-indigo-900 px-4 py-2 rounded-xl shadow"
            >
              <p className="text-sm font-medium">Interviewer:</p>
              <p className="text-sm whitespace-pre-wrap">{msg.question}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="self-start max-w-[75%] bg-white border border-gray-200 px-4 py-2 rounded-xl shadow"
            >
              <p className="text-sm font-medium text-gray-800">You:</p>
              <p className="text-sm whitespace-pre-wrap">{msg.answer}</p>

              {(msg.rating || msg.feedback) && (
                <div className="mt-2 text-xs space-y-1">
                  {msg.rating && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                      ⭐ Rating: {msg.rating}
                    </span>
                  )}
                  {msg.feedback && (
                    <div className="text-gray-600 text-xs italic space-y-2 mt-1">
                      {msg.feedback.split("____").map((part, i) => (
                        <div
                          key={i}
                          className="bg-gray-50 p-2 rounded-md border border-gray-200"
                        >
                          {part.trim()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
