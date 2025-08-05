import React, { useEffect, useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface RatingData {
  name: string;
  rating: number | undefined;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        className="bg-white shadow-lg rounded-lg p-3 border border-gray-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-purple-700">
          Rating: <span className="font-bold">{payload[0].value}</span>
        </p>
      </motion.div>
    );
  }
  return null;
};

export default function QAChart({
  QAndRate,
}: {
  QAndRate: { question: string; rating: number | undefined }[];
}) {
  const [chartData, setChartData] = useState<RatingData[]>([]);
  const normalizeRating = (rating: number | undefined) => {
    return rating !== undefined ? rating : 0;
  };
  useEffect(() => {
    const formattedData = QAndRate.map((item) => ({
      name:
        item.question.length > 15
          ? item.question.slice(0, 15) + "..."
          : item.question,
      rating: normalizeRating(item.rating),
    }));
    setChartData(formattedData);
  }, [QAndRate]);

  return (
    <motion.div
      className="w-full p-4 rounded-xl  bg-gradient-to-br from-white via-gray-50 to-purple-50 border border-purple-100"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.h2
        className="text-xl font-bold mb-4 text-purple-700"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Interview Question Ratings
      </motion.h2>

      <ResponsiveContainer className={"border-0"} width="100%" height={450}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
        >
          <defs>
            <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="rating"
            barSize={20}
            fill="url(#barColor)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="url(#lineColor)"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{
              r: 6,
              onMouseOver: () => {},
              onMouseOut: () => {},
            }}
            isAnimationActive={true}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
