import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
} from "recharts";

export default function GlobalEmotionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="mt-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <p className="text-gray-500 text-sm italic text-center">
          There is no aggregated emotional data from all reviews yet.
        </p>
      </div>
    );
  }

  const colorPalette = {
    Anger: "#ef4444",
    Anticipation: "#f59e0b",
    Disgust: "#10b981",
    Fear: "#3b82f6",
    Joy: "#8b5cf6",
    Optimism: "#ec4899",
    Sadness: "#14b8a6",
    Surprise: "#a855f7",
  };

  // Hitung rata-rata score
  const avgScore =
    data.reduce((acc, cur) => acc + (cur.Score || 0), 0) / data.length;

  return (
    <div className="mt-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="Emotion" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [value.toFixed(3), "Average Score"]}
            contentStyle={{
              fontSize: "0.85rem",
              borderRadius: "10px",
              borderColor: "#c7d2fe",
            }}
          />

          {/* 🔹 Bar chart */}
          <Bar
            dataKey="Score"
            radius={[8, 8, 0, 0]}
            name="Average Emotion Score"
            fill="#6366f1"
          >
            <LabelList
              dataKey="Score"
              position="top"
              fontSize={10}
              fill="#374151"
            />
          </Bar>

          {/* 🔹 Garis rata-rata superjelas */}
          <ReferenceLine
            y={avgScore}
            stroke="#ffeb3b" // kuning neon cerah
            strokeWidth={3} // lebih tebal
            strokeDasharray="6 3"
            ifOverflow="extendDomain"
            label={{
              value: `Avg = ${avgScore.toFixed(3)}`,
              position: "top",
              offset: 12,
              fill: "#000000", // teks hitam biar kontras
              fontSize: 14,
              fontWeight: 750,
              backgroundColor: "rgba(255, 255, 255, 0.8)", // semi-transparan di belakang teks
              padding: 4,
              style: {
                textShadow: "1px 1px 2px rgba(255,255,255,0.8)", // biar tetap kebaca di biru
              },
            }}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="text-center mt-3 text-xs text-gray-500">
        Displays the average emotion level of all analyzed reviews (with an
        overall average benchmark line).
      </div>
    </div>
  );
}
