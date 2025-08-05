import { EvaluationData} from "@/models/evaluation.model";
import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { RadarIcon } from "lucide-react";

const transformData = (evaluation: EvaluationData) => {
  return [
    { subject: "Communication", score: evaluation.communication.score },
    {
      subject: "Technical Knowledge  ",
      score: evaluation.technicalKnowledge.score,
    },
    { subject: "Problem Solving", score: evaluation.problemSolving.score },
    { subject: "Vocabulary", score: evaluation.vocabulary.score },
    { subject: "Clarity", score: evaluation.explanationClarity.score },
    {
      subject: "Domain Knowledge",
      score: evaluation.perceivedDomainKnowledge.score,
    },
    {
      subject: "Response Structure",
      score: evaluation.responseStructure.score,
    },
    { subject: "Tone", score: evaluation.professionalTone.score },
  ];
};

export default function PerformanceRadarChart({
  evaluation,
}: {
  evaluation: EvaluationData;
}) {
  const data = transformData(evaluation);

  return (
    <div className="w-full h-[500px] rounded-xl shadow-xl  overflow-hidden relative">
      {/* Header */}
      <motion.div
        className="p-4 bg-blue-100/60 backdrop-blur-md sticky top-0 z-10 border-b border-purple-200 shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
      >
        <motion.h3
          className="text-xl font-extrabold flex gap-2 items-center text-purple-800 tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <RadarIcon />
          Performance Overview
        </motion.h3>
        <motion.p
          className="text-sm text-gray-600 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Multi-dimensional performance analysis of the candidate
        </motion.p>
      </motion.div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          cx="50%"
          cy="45%"
          outerRadius="60%"
          data={data}
          // margin={{ top: 10, right: 30, bottom: 20, left: 10 }}
        >
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.5} />
            </radialGradient>
          </defs>
          <PolarGrid stroke="#d1d5db" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: "#4c1d95", fontWeight: 500 }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            stroke="#c4b5fd"
            tick={{ fontSize: 10, fill: "#6b7280" }}
          />
          <Radar
            name="Performance"
            dataKey="score"
            stroke="#7c3aed"
            fill="url(#radarGradient)"
            fillOpacity={0.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
