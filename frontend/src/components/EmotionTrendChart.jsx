import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function EmotionTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="mt-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-indigo-700 mb-3 text-center">
          Emotion Trend Chart (Per Review)
        </h3>
        <p className="text-gray-500 text-sm italic text-center">
          There is no emotion trend data to display yet.
        </p>
      </div>
    );
  }

  // Transform data: tiap emosi → array [{x, y}]
  const mergedData = [];
  const emotionNames = Object.keys(data);

  // Transform "emotion_trend" JSON dari backend ke format recharts
  const maxLength = Math.max(...emotionNames.map((e) => data[e].length));
  for (let i = 0; i < maxLength; i++) {
    const entry = { Review: i + 1 };
    emotionNames.forEach((emo) => {
      if (data[emo][i]) {
        entry[emo] = data[emo][i].y;
      }
    });
    mergedData.push(entry);
  }

  const colors = {
    Anger: "#ef4444",
    Anticipation: "#f59e0b",
    Disgust: "#10b981",
    Fear: "#3b82f6",
    Joy: "#8b5cf6",
    Optimism: "#ec4899",
    Sadness: "#14b8a6",
    Surprise: "#a855f7",
  };

  return (
    <div className="mt-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={mergedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="Review"
            label={{
              value: "Review Sequence",
              position: "insideBottom",
              offset: -5,
              fontSize: 12,
            }}
          />
          <YAxis
            domain={[0, 1]}
            label={{
              value: "Skor Emosi",
              angle: -90,
              position: "insideLeft",
              fontSize: 12,
            }}
          />
          <Tooltip formatter={(v) => v.toFixed(3)} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />

          {emotionNames.map((emo) => (
            <Line
              key={emo}
              type="monotone"
              dataKey={emo}
              stroke={colors[emo] || "#6366f1"}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="text-center mt-3 text-xs text-gray-500">
        Displays the change in emotion scores for each review described
        (longitudinal trend).
      </div>
    </div>
  );
}
