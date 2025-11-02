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

  function toggleGenre(g) {
    setSelected((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setWarning("");

    if (!review.trim() || selected.length === 0) {
      setWarning("Tolong isi minimal satu ulasan dan pilih genre.");
      return;
    }

    const reviews = review
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (reviews.length === 0) {
      setWarning("Pastikan ada minimal satu ulasan valid.");
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

      // Backend sekarang kirim: { results: [...], aggregate: {...} }
      setResult({
        results: data.results || [],
        aggregate: data.aggregate || null,
        count: data.results ? data.results.length : 0,
      });

      setHasAnalysis(true);
    } catch (err) {
      console.error(err);
      setWarning("Gagal terhubung ke server Flask. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  }

  const handleClear = () => {
    clearResults();
    setReview("");
    setSelected([]);
    setHasAnalysis(false);
    setWarning("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder={`Enter multiple reviews (separate them with Enter)\nExample:\nThis film is very touching.\nThe story is suspenseful from beginning to end.`}
        className="w-full p-4 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        rows={8}
      />

      {warning && (
        <div className="text-red-500 text-sm font-medium mt-1">{warning}</div>
      )}

      <div>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => toggleGenre(g)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                selected.includes(g)
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Pilih genre yang relevan (boleh lebih dari satu).
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        {hasAnalysis && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition"
          >
            Bersihkan Riwayat
          </button>
        )}
        <button
          type="submit"
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:scale-[1.02] transition"
        >
          Analisa
        </button>
      </div>
    </form>
  );
}
