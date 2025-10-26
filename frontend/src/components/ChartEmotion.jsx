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

  //  Warna berbeda untuk tiap emosi
  const colorMap = {
    Joy: "#facc15", // Kuning cerah
    Fear: "#6366f1", // Biru keunguan
    Sadness: "#60a5fa", // Biru muda
    Anger: "#ef4444", // Merah
    Anticipation: "#a855f7", // Ungu muda
    Disgust: "#84cc16", // Hijau
    Surprise: "#f472b6", // Pink
    Optimism: "#22c55e", // Hijau cerah
  };

  const bgColors = labels.map((l) => colorMap[l] || "#94a3b8"); // warna default abu-abu lembut

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

  return <Bar data={data} options={options} />;
}
