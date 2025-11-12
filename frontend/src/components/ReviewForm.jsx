import React, { useState } from "react";

const GENRES = [
  "Drama", "Romance", "Comedy", "Thriller", "Action", "Fantasy",
  "Horror", "Family", "Adventure", "Crime", "Science Fiction",
  "Mystery", "Music", "Animation", "Foreign", "History",
  "Documentary", "War", "TV Movie", "Western",
];

export default function ReviewForm({ setResult, setLoading, clearResults }) {
  const [review, setReview] = useState("");
  const [selected, setSelected] = useState([]);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [warning, setWarning] = useState("");

  // ==========================================================
  // Toggle pilihan genre
  // ==========================================================
  function toggleGenre(g) {
    setSelected((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  // ==========================================================
  // Kirim data ke backend Flask
  // ==========================================================
  async function handleSubmit(e) {
    e.preventDefault();
    setWarning("");

    if (!review.trim() || selected.length === 0) {
      setWarning("Please fill in at least one review and select a genre.");
      return;
    }

    const reviews = review
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (reviews.length === 0) {
      setWarning("Make sure there is at least one valid review.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews, genres: selected }),
      });
      const data = await res.json();

      setResult({
        results: data.results || [],
        aggregate: data.aggregate || null,
        analysisData: {
          global_emotion_chart: data.global_emotion_chart || [],
          genre_emotion_summary: data.genre_emotion_summary || [],
          emotion_trend: data.emotion_trend || [],
        },
        count: data.results ? data.results.length : 0,
      });

      setHasAnalysis(true);
    } catch (err) {
      console.error(err);
      setWarning("Failed to connect to Flask server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // Reset analisis dan hapus cache backend
  // ==========================================================
  async function handleClear() {
    setWarning("");
    setLoading(true);
    try {
      await fetch("/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      clearResults();
      setReview("");
      setSelected([]);
      setHasAnalysis(false);
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.error(err);
      setWarning("Failed to delete data in backend.");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // UI (Horizontal Wide Layout)
  // ==========================================================
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/70 border border-gray-200 rounded-2xl p-6 shadow-md backdrop-blur-sm mb-6 transition-all"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== Text Input Area ===== */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-2">
            Enter some reviews:
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full flex-1 min-h-[200px] p-4 rounded-xl border border-gray-300 shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm text-gray-800"
            rows={8}
          />
          {warning && (
            <div className="text-red-500 text-xs font-medium mt-1">{warning}</div>
          )}
        </div>

        {/* ===== Genre Selection ===== */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Select the relevant genre:
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {GENRES.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => toggleGenre(g)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selected.includes(g)
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 italic">
            Can choose more than one genre.
          </div>
        </div>
      </div>

      {/* ===== Actions ===== */}
      <div className="flex justify-between items-center mt-6">
        {hasAnalysis && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition"
          >
            Clear History
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:scale-[1.03] transition"
        >
        Analysis
        </button>
      </div>
    </form>
  );
}
