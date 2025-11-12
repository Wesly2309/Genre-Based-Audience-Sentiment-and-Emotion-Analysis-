import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ChartEmotion({ scores = [] }) {
  const labels = scores.map((s) => s.Emotion);
  const dataVals = scores.map((s) => s.Score);

  const colorMap = {
    Joy: "#facc15",
    Fear: "#6366f1",
    Sadness: "#60a5fa",
    Anger: "#ef4444",
    Anticipation: "#a855f7",
    Disgust: "#84cc16",
    Surprise: "#f472b6",
    Optimism: "#22c55e",
  };

  const bgColors = labels.map((l) => colorMap[l] || "#94a3b8");

  const data = {
    labels,
    datasets: [
      {
        label: "Probability",
        data: dataVals,
        backgroundColor: bgColors,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ffffff",
        barThickness: 20,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#000",
        bodyColor: "#000",
      },
    },
    scales: {
      x: { max: 1, ticks: { stepSize: 0.2 } },
      y: { ticks: { color: "#374151" } },
    },
  };

  return (
    <div className="w-full h-full">
      <Bar data={data} options={options} />
    </div>
  );
}
