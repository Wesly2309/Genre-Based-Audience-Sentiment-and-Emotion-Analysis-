import React, { useState } from "react";
import ReviewForm from "./components/ReviewForm";
import ResultCard from "./components/ResultCard";
import EmotionGenreChart from "./components/EmotionGenreChart";
import { exportToCSV } from "./utils/exportCSV";

export default function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Menerima hasil dari ReviewForm
  const handleSetResult = (data) => {
    setResults((prev) => [...prev, data]);
  };

  // Menghapus semua hasil
  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          Genre-Based Audience Sentiment & Emotion Analysis
        </h1>

        {/* Form input & analisis */}
        <ReviewForm
          setResult={handleSetResult}
          setLoading={setLoading}
          clearResults={clearResults}
        />

        {/* Status loading */}
        {loading && (
          <div className="text-center text-gray-600 mt-4">
            Sedang menganalisis...
          </div>
        )}

        {/* Hasil analisis */}
        {!loading && results.length > 0 && (
          <div className="mt-6 space-y-6">
            {/* Tombol Export CSV */}
            <div className="flex justify-end items-center">
              <button
                onClick={() => exportToCSV(results)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
              >
                Export to CSV
              </button>
            </div>

            {/* Daftar hasil analisis */}
            {results.map((res, idx) => (
              <ResultCard key={idx} result={res} />
            ))}

            {/* Chart agregat genre–emosi */}
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
