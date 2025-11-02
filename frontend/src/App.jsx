import React, { useState } from "react";
import ReviewForm from "./components/ReviewForm";
import ResultCard from "./components/ResultCard";
import EmotionGenreChart from "./components/EmotionGenreChart";
import { exportToCSV } from "./utils/exportCSV";

export default function App() {
  const [results, setResults] = useState([]);       // hasil per review
  const [aggregate, setAggregate] = useState(null); // hasil gabungan global
  const [loading, setLoading] = useState(false);

  // --- Callback setelah form submit ---
  const handleSetResult = (data) => {
    // Jika backend kirim aggregate (hasil gabungan semua ulasan)
    if (data.aggregate) {
      setAggregate(data.aggregate);
    }

    if (Array.isArray(data.results)) {
      setResults(data.results);
    } else if (data.results) {
      setResults([data.results]);
    }
  };

  const clearResults = () => {
    setResults([]);
    setAggregate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          Genre-Based Audience Sentiment & Emotion Analysis
        </h1>

        {/* Form Input Ulasan */}
        <ReviewForm
          setResult={handleSetResult}
          setLoading={setLoading}
          clearResults={clearResults}
        />

        {/* Loading State */}
        {loading && (
          <div className="text-center text-gray-600 mt-4">
            Sedang menganalisis...
          </div>
        )}

        {/* Hasil Analisis */}
        {!loading && (results.length > 0 || aggregate) && (
          <div className="mt-6 space-y-6">
            <div className="flex justify-end items-center">
              <button
                onClick={() => exportToCSV(results)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
              >
                Export to CSV
              </button>
            </div>

            {/* Jika backend kirim aggregate global (gabungan semua ulasan) */}
            {aggregate && <ResultCard result={aggregate} />}

            {/* Tampilkan hasil per-review individual */}
            {results.map((res, idx) => (
              <ResultCard key={idx} result={res} />
            ))}

            {/* Chart Gabungan Global (rata-rata per genre & emosi) */}
            <EmotionGenreChart data={results} />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-400 text-sm mt-8">
          Backend: Flask API · Frontend: React + TailwindCSS
        </footer>
      </div>
    </div>
  );
}
