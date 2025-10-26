import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export default function EmotionGenreChart({ data }) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    const genreEmotionMap = {};

    data.forEach((item) => {
      if (!item.Genre || !Array.isArray(item.Genre) || !item.Emotions) return;
      item.Genre.forEach((g) => {
        if (!genreEmotionMap[g]) genreEmotionMap[g] = {};
        item.Emotions.forEach((e) => {
          if (!e.Emotion || typeof e.Score !== "number") return;
          if (!genreEmotionMap[g][e.Emotion])
            genreEmotionMap[g][e.Emotion] = [];
          genreEmotionMap[g][e.Emotion].push(e.Score);
        });
      });
    });

    return Object.entries(genreEmotionMap).map(([genre, emotions]) => {
      const avgEmotions = {};
      Object.entries(emotions).forEach(([emotion, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        avgEmotions[emotion] = Number(avg.toFixed(3));
      });
      return { genre, ...avgEmotions };
    });
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="mt-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <h3 className="text-lg font-bold text-indigo-700 mb-3">
          Genre–Emotion Correlation Chart
        </h3>
        <p className="text-gray-500 text-sm italic">
          Belum ada cukup data untuk menampilkan chart.
        </p>
      </div>
    );
  }

  const emotionKeys = Object.keys(chartData[0] || {}).filter(
    (key) => key !== "genre"
  );

  //  Palet warna tetap (beda untuk tiap emosi)
  const colorPalette = [
    "#ef4444", // merah - anger
    "#f59e0b", // kuning - anticipation
    "#10b981", // hijau - joy/optimism
    "#3b82f6", // biru - sadness
    "#8b5cf6", // ungu - fear/surprise
    "#ec4899", // pink - love/trust
    "#14b8a6", // teal - calm
    "#a855f7", // violet
  ];

  return (
    <div className="mt-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
      <h3 className="text-lg font-bold text-indigo-700 mb-3">
        Genre–Emotion Correlation Chart
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="genre" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ fontSize: "0.85rem", borderRadius: "10px" }}
          />
          <Legend wrapperStyle={{ fontSize: "0.8rem" }} />

          {/*  FIX: Set warna langsung di atribut `fill` dengan mapping index */}
          {emotionKeys.map((emotion, i) => (
            <Bar
              key={i}
              dataKey={emotion}
              fill={colorPalette[i % colorPalette.length]} // beda tiap emosi
              radius={[6, 6, 0, 0]}
            >
              <LabelList dataKey={emotion} position="top" fontSize={10} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
