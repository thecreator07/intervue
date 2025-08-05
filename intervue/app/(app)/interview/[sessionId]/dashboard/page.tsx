"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { SessionData } from "@/models/session.model";
import { EvaluationData } from "@/models/evaluation.model";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Analytics from "../../components/Analytics";
import ChatPage from "../../components/Conversation";

interface DashboardData {
  conversationData: SessionData;
  evaluationData: EvaluationData;
}

export default function InterviewDashboard() {
  const { data: session } = useSession();
  const params = useParams();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toggle, setToggle] = useState<"Analytics" | "Conversation">("Analytics");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`/api/conversation?sessionId=${params.sessionId}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setDashboardData(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    if (session) fetchDashboardData();
  }, [params.sessionId, session]);

  if (!session) return <div className="p-4 text-center">🔐 Please sign in to view this dashboard.</div>;
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin w-6 h-6 text-purple-600" /></div>;
  if (error) return <div className="p-4 text-red-500 text-center">⚠️ {error}</div>;
  if (!dashboardData) return <div className="p-4 text-center">No data available.</div>;

  // Calculate average score
  const evaluation = dashboardData.evaluationData;
  const keys = [
    "communication",
    "technicalKnowledge",
    "problemSolving",
    "vocabulary",
    "explanationClarity",
    "perceivedDomainKnowledge",
    "responseStructure",
    "professionalTone",
  ];
  const scores = keys.map((key) => evaluation[key as keyof typeof evaluation]?.score || 0);
  const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10)

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col gap-6 max-w-7xl">
      <motion.h1
        className="text-3xl font-extrabold text-center text-purple-700 tracking-tight"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Interview Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interview Details */}
        <motion.div
          className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl shadow-lg border border-purple-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-purple-800 mb-4">Interview Details</h2>
          <div className="text-sm space-y-2 text-gray-700">
            <p><span className="font-medium">Resume:</span> {dashboardData.conversationData.resumeName}</p>
          </div>
        </motion.div>

        {/* Evaluation Details */}
        <motion.div
          className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl shadow-lg border border-purple-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-purple-800 mb-4">Evaluation Results</h2>
          <div className="text-sm space-y-2 text-gray-700">
            <p><span className="font-medium">Score:</span> {averageScore} / 100</p>
            <p className="text-xs text-gray-500">Based on 8 evaluation metrics.</p>
          </div>
        </motion.div>
      </div>

      {/* Toggle Section */}
      <motion.div
        className="bg-blue-100/50 rounded-full shadow-inner flex justify-center px-1 py-1 border border-blue-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {["Analytics", "Conversation"].map((tab:string) => (
          <button
            key={tab}
            onClick={() => setToggle(tab as "Analytics" | "Conversation")}
            className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-all ${
              toggle === tab
                ? "bg-blue-500 text-white shadow-md"
                : "text-blue-700 hover:bg-blue-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Section Toggle Content */}
      <motion.div
        key={toggle}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-2"
      >
        {toggle === "Analytics" ? (
          <Analytics
            evaluation={dashboardData.evaluationData}
            conversation={dashboardData.conversationData.conversation}
            summary={dashboardData.conversationData.summary}
          />
        ) : (
          <ChatPage conversation={dashboardData.conversationData} />
        )}
      </motion.div>
    </div>
  );
}
