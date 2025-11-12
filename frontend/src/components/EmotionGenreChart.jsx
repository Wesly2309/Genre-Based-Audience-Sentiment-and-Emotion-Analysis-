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
  // Normalisasi data biar fleksibel
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Data backend dari genre_emotion_summary (berisi { genre: "...", Emotion: ... })
    if (data[0]?.genre) {
      return data.map((item) => ({
        genre: item.genre,
        ...Object.fromEntries(
          Object.entries(item).filter(([k]) => k !== "genre" && k !== "Genre")
        ),
      }));
    }

    // Data berbentuk hasil analisis tiap review (ada Genre & Emotions)
    const genreEmotionMap = {};
    data.forEach((item) => {
      const genres = Array.isArray(item.Genre) ? item.Genre : [];
      const emotionList = Array.isArray(item.Emotions) ? item.Emotions : [];

      genres.forEach((g) => {
        if (!genreEmotionMap[g]) genreEmotionMap[g] = {};
        emotionList.forEach((e) => {
          if (!e || !e.Emotion) return;
          if (!genreEmotionMap[g][e.Emotion])
            genreEmotionMap[g][e.Emotion] = [];
          genreEmotionMap[g][e.Emotion].push(e.Score);
        });
      });
    });

    return Object.entries(genreEmotionMap).map(([genre, emos]) => {
      const avg = {};
      for (const [emo, vals] of Object.entries(emos)) {
        avg[emo] = Number(
          (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)
        );
      }
      return { genre, ...avg };
    });
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="mt-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <p className="text-gray-500 text-sm italic">
          There is not enough data to display a chart.
        </p>
      </div>
    );
  }

  const emotionKeys = Object.keys(chartData[0] || {}).filter(
    (k) => k !== "genre"
  );

  const colorPalette = [
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#a855f7",
  ];

  return (
    <div className="mt-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="genre" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              fontSize: "0.85rem",
              borderRadius: "10px",
              backgroundColor: "white",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "0.8rem" }} />

          {emotionKeys.map((emotion, i) => (
            <Bar
              key={i}
              dataKey={emotion}
              fill={colorPalette[i % colorPalette.length]}
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
