"use client";

import { EvaluationData } from "@/models/evaluation.model";
import { Messagedata, } from "@/models/session.model";
import { motion } from "framer-motion";
import QAChart from "./Chart/QAchart";
import { useEffect, useState } from "react";
import PerformanceRadarChart from "./Chart/Performance";
import {
  BarChart2,
  CheckCheck,
  CheckCircle,

  MessageSquare,
  Star,
  UserIcon,
} from "lucide-react";

interface AnalyticsProps {
  evaluation: EvaluationData;
  conversation: Messagedata[];
  summary: string | undefined;
}

export default function Analytics({
  evaluation,
  conversation,
  summary,
}: AnalyticsProps) {
  const [QAndRate, setQAndRate] = useState<
    { question: string; rating: number | undefined }[]
  >([]);
  const commentItems = [
    { title: "Communication", value: evaluation.communication.comment },
    {
      title: "Technical Knowledge",
      value: evaluation.technicalKnowledge.comment,
    },
    { title: "Problem Solving", value: evaluation.problemSolving.comment },
    { title: "Vocabulary", value: evaluation.vocabulary.comment },
    {
      title: "Explanation Clarity",
      value: evaluation.explanationClarity.comment,
    },
    {
      title: "Domain Knowledge",
      value: evaluation.perceivedDomainKnowledge.comment,
    },
    {
      title: "Response Structure",
      value: evaluation.responseStructure.comment,
    },
    { title: "Professional Tone", value: evaluation.professionalTone.comment },
  ];
  useEffect(() => {
    const questionsAndRatings = conversation.map((msg, index) => ({
      question: `Q${index + 1}`,
      rating: Number(msg.rating),
    }));
    setQAndRate(questionsAndRatings);
  }, [conversation]);

  return (
    <>
      <section className="grid grid-cols-1 gap-4 hide-scrollbar">
        <motion.div
          className="bg-blue-50 rounded-xl shadow  w-full justify-around"
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          //   transition={{
          //     duration: 2,
          //     repeat: Infinity,
          //     ease: "easeInOut",
          //   }}
        >
          <QAChart QAndRate={QAndRate} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <motion.div
            className=" shadow rounded-xl w-full justify-around"
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <PerformanceRadarChart evaluation={evaluation} />
          </motion.div>
          <motion.div
            className="hide-scrollbar shadow-xl rounded-2xl w-full max-h-[500px] overflow-y-auto  border border-purple-200"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Header */}
            <h3 className="text-xl  font-extrabold text-purple-800 mb-2 sticky top-0 z-20 bg-blue-100/70 backdrop-blur-md border-b border-purple-200 px-4 py-3 flex items-center gap-2 shadow-sm">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              Comments
            </h3>

            {/* Comments List */}
            <div className="space-y-3 px-4 pb-4">
              {commentItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  className="bg-white/90 backdrop-blur rounded-lg shadow-md border-l-[5px] border-purple-400 hover:shadow-xl transition-shadow px-4 py-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="text-sm font-semibold text-gray-800 tracking-tight">
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-600 italic mt-1">
                    {item.value}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <motion.div
            className="shadow-lg rounded-2xl w-full overflow-hidden"
            initial={{ y: 30, opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="text-xl font-bold text-purple-800 sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-purple-200 px-4 py-3 flex items-center gap-2 shadow-sm">
              <motion.span
                initial={{ rotate: -15, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2,
                }}
                className="text-purple-600"
              >
                <MessageSquare className="w-5 h-5" />
              </motion.span>
              Keywords Detected
            </div>

            <div className="flex flex-wrap gap-3 p-6">
              {evaluation.keywordsUsedAcrossSession.map((word, idx) => (
                <motion.span
                  key={idx}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm px-4 py-1.5 rounded-full font-semibold shadow hover:shadow-md transition-all duration-300"
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="shadow-xl rounded-2xl w-full overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <div className="text-xl font-bold text-purple-800 sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-purple-200 px-4 py-3 flex items-center gap-2 shadow-sm">
              <motion.span
                initial={{ rotate: -15, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2,
                }}
                className="text-purple-600"
              >
                <CheckCircle className="w-5 h-5" />
              </motion.span>
              Strengths
            </div>

            <div className="flex flex-col gap-3 p-4">
              {evaluation.strengths.map((sentence, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-start gap-2 text-sm text-gray-800"
                >
                  <Star className="w-4 h-4 text-purple-600 mt-1 animate-pulse" />
                  <span>{sentence}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="shadow-xl rounded-2xl w-full overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <div className="text-xl font-bold text-rose-800 sticky top-0 z-20 bg-white/70 backdrop-blur-md border-b border-rose-200 px-4 py-3 flex items-center gap-2 shadow-sm">
              <motion.span
                initial={{ rotate: -8, scale: 0.95 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{
                  repeat: Infinity,
                  repeatType: "reverse",
                  duration: 2,
                }}
                className="text-rose-600"
              >
                <CheckCheck className="w-5 h-5" />
              </motion.span>
              Areas of Improvement
            </div>

            <div className="flex flex-col gap-3 p-4">
              {evaluation.areasOfImprovement.map((sentence, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-start gap-2 text-sm text-gray-800"
                >
                  <BarChart2 className="w-4 h-4 text-rose-600 mt-1 animate-pulse" />
                  <span>{sentence}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <motion.div
            className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 px-6 py-5 bg-gradient-to-br from-white via-slate-50 to-blue-50 border border-purple-100/30"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.h3
              className="text-2xl font-bold flex items-center gap-2 text-purple-800 tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <UserIcon className="text-purple-700 w-5 h-5" />
              Performance Overview
            </motion.h3>

            <motion.p
              className="text-sm text-gray-600 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              A comprehensive analysis of the candidate’s performance across key
              dimensions.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              {[
                {
                  label: "Technical Competency",
                  value: evaluation.hrInsights?.technicalCompetency,
                },
                {
                  label: "Experience Level",
                  value: evaluation.hrInsights?.experienceLevel,
                },
                {
                  label: "Learning Potential",
                  value: evaluation.hrInsights?.learningPotential,
                },
                {
                  label: "Cultural Fit",
                  value: evaluation.hrInsights?.culturalFit,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="p-4 rounded-xl bg-white/70 backdrop-blur-md border border-purple-100 shadow-sm hover:shadow-md transition-all"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.1 }}
                >
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {item.label}
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {item.value || "N/A"}
                  </p>
                </motion.div>
              ))}

              <motion.div
                className="p-4 rounded-xl bg-white/70 backdrop-blur-md border border-purple-100 shadow-sm hover:shadow-md transition-all col-span-1 sm:col-span-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Comments
                </p>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {evaluation.hrInsights?.comments ||
                    "No additional comments provided."}
                </p>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            className=" rounded-2xl shadow-lg hover:shadow-2xl transition-shadow px-5 py-4 border border-indigo-100"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <motion.h3
              className="text-lg font-bold flex gap-2 items-center text-indigo-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <UserIcon />
              AI Interviewer Notes
            </motion.h3>

            <motion.p
              className="text-sm text-gray-500 mtb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Comprehensive Analysis summary
            </motion.p>

            <motion.p className="text-sm text-gray-800 mt-3 leading-relaxed">
              {summary}
            </motion.p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
