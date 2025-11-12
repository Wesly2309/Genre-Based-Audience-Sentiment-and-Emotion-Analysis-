import React, { useRef, useState, useEffect } from "react";
import ReviewForm from "./components/ReviewForm";
import ResultCard from "./components/ResultCard";
import GlobalEmotionChart from "./components/GlobalEmotionChart";
import EmotionTrendChart from "./components/EmotionTrendChart";
import EmotionGenreChart from "./components/EmotionGenreChart";
import { exportToCSV } from "./utils/exportCSV";
import html2canvas from "html2canvas";

export default function App() {
  const [results, setResults] = useState([]);
  const [globalChart, setGlobalChart] = useState([]);
  const [genreChart, setGenreChart] = useState([]);
  const [emotionTrend, setEmotionTrend] = useState({});
  const [loading, setLoading] = useState(false);

  // Refs untuk tiap chart
  const globalChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const genreChartRef = useRef(null);

  // ==========================================================
  // 🔹 Tambahan baru: Muat ulang data lama dari backend saat halaman dibuka
  // ==========================================================
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/history");
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setResults(data.results);
          setGlobalChart(data.global_emotion_chart || []);
          setGenreChart(data.genre_emotion_summary || []);
          if (data.emotion_trend) {
            setEmotionTrend(
              Object.fromEntries(
                data.emotion_trend.map((d) => [d.Emotion, d.Points])
              )
            );
          }
        }
      } catch (err) {
        console.error("Gagal memuat data cache:", err);
      }
    };
    fetchHistory();
  }, []);

  // ==========================================================
  // Fungsi untuk menerima hasil baru dari ReviewForm
  // ==========================================================
  const handleSetResult = (data) => {
    if (Array.isArray(data.results))
      setResults((prev) => [...prev, ...data.results]);

    if (data.analysisData) {
      setGlobalChart(data.analysisData.global_emotion_chart || []);
      setGenreChart(data.analysisData.genre_emotion_summary || []);
      if (data.analysisData.emotion_trend) {
        setEmotionTrend(
          Object.fromEntries(
            data.analysisData.emotion_trend.map((d) => [d.Emotion, d.Points])
          )
        );
      }
    } else {
      setGlobalChart(data.global_emotion_chart || []);
      setGenreChart(data.genre_emotion_summary || []);
      if (data.emotion_trend) {
        setEmotionTrend(
          Object.fromEntries(
            data.emotion_trend.map((d) => [d.Emotion, d.Points])
          )
        );
      }
    }
  };

  // ==========================================================
  // Bersihkan semua hasil (dipanggil dari tombol Clear History)
  // ==========================================================
  const clearResults = () => {
    setResults([]);
    setGlobalChart([]);
    setGenreChart([]);
    setEmotionTrend({});
  };

  // ==========================================================
  // Fungsi Export Chart terpisah jadi PNG
  // ==========================================================
  const handleExportCharts = async () => {
    const chartsToExport = [
      { ref: globalChartRef, name: "global_chart.png" },
      { ref: trendChartRef, name: "emotion_trend_chart.png" },
      { ref: genreChartRef, name: "genre_emotion_chart.png" },
    ];

    for (const chart of chartsToExport) {
      if (chart.ref.current) {
        try {
          const canvas = await html2canvas(chart.ref.current, {
            scale: 2,
            backgroundColor: "#ffffff",
          });
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = chart.name;
          link.click();
        } catch (err) {
          console.error(`Gagal export ${chart.name}:`, err);
        }
      }
    }
  };

  // ==========================================================
  // UI Rendering utama
  // ==========================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-10 flex flex-col items-center">
      <div className="w-full max-w-7xl space-y-10">
        {/* ============================= */}
        {/* FORM SECTION */}
        {/* ============================= */}
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <h1 className="text-3xl font-extrabold text-center text-indigo-700 mb-8 tracking-tight">
            Genre-Based Audience Sentiment & Emotion Analysis
          </h1>

          <ReviewForm
            setResult={handleSetResult}
            setLoading={setLoading}
            clearResults={clearResults}
          />

          {loading && (
            <div className="text-center text-gray-600 mt-4 animate-pulse">
              Currently analyzing...
            </div>
          )}
        </div>

        {/* ============================= */}
        {/* CHART SECTIONS */}
        {/* ============================= */}
        {!loading && (results.length > 0 || globalChart.length > 0) && (
          <>
            {/* Tombol Ekspor (Kiri PNG, Kanan CSV) */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleExportCharts}
                className="px-5 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
              >
                Export Charts as PNG
              </button>

              <button
                onClick={() => exportToCSV(results)}
                className="px-5 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
              >
                Export to CSV
              </button>
            </div>

            <div className="space-y-8 mt-6">
              {/* Global Emotion Chart */}
              {globalChart.length > 0 && (
                <div
                  ref={globalChartRef}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-xl font-semibold text-indigo-700 mb-4">
                    Global Emotion Aggregation Chart
                  </h3>
                  <GlobalEmotionChart data={globalChart} />
                </div>
              )}

              {/* Emotion Trend Chart */}
              {emotionTrend && Object.keys(emotionTrend).length > 0 && (
                <div
                  ref={trendChartRef}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-xl font-semibold text-indigo-700 mb-4">
                    Emotion Trend Chart
                  </h3>
                  <EmotionTrendChart data={emotionTrend} />
                </div>
              )}

              {/* Genre–Emotion Chart */}
              {genreChart.length > 0 && (
                <div
                  ref={genreChartRef}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-xl font-semibold text-indigo-700 mb-4">
                    Genre–Emotion Correlation Chart
                  </h3>
                  <EmotionGenreChart data={genreChart} />
                </div>
              )}
            </div>

            {/* ============================= */}
            {/* RESULT CARDS */}
            {/* ============================= */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
              {results.map((res, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <ResultCard
                    result={res}
                    analysisData={{
                      global_emotion_chart: globalChart,
                      genre_emotion_summary: genreChart,
                      emotion_trend: emotionTrend,
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-400 text-sm mt-10">
          Backend: Flask API · Frontend: React + TailwindCSS
        </footer>
      </div>
    </div>
  );
}
