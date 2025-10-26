import React, { useState } from "react";

const GENRES = [
  "drama",
  "thriller",
  "horror",
  "comedy",
  "romance",
  "adventure",
  "music",
  "family",
  "psychological",
  "parody",
  "school",
  "magic",
  "vampire",
  "shoujo",
  "space",
  "shounen",
  "shoujo ai",
  "seinen",
  "super power",
  "samurai",
  "military",
  "martial arts",
  "supernatural",
  "war",
  "demons",
  "historical",
  "slice of life",
  "animation",
  "mecha",
  "fantasy",
  "science fiction",
  "action",
  "crime",
  "mystery",
  "foreign",
  "documentary",
  "biography",
  "game",
  "sports",
  "western"
];

export default function ReviewForm({ setResult, setLoading, clearResults }) {
  const [review, setReview] = useState("");
  const [selected, setSelected] = useState([]);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [warning, setWarning] = useState(""); // untuk pesan warning

  function toggleGenre(g) {
    setSelected((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // reset warning dulu
    setWarning("");

    // validasi manual
    if (!review.trim() || selected.length === 0) {
      setWarning("Tolong isi ulasan dan pilih minimal satu genre.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review, genres: selected }),
      });
      const data = await res.json();
      setResult({
        ...data,
        Review: review,
        Genres: selected,
      });
      setHasAnalysis(true);
    } catch (err) {
      setWarning("Gagal terhubung ke server. Pastikan backend Flask berjalan.");
    } finally {
      setLoading(false);
    }
  }

  // langsung hapus tanpa konfirmasi
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
        placeholder="Example: The film is full of suspense, emotional scenes, and is very touching."
        className="w-full p-4 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        rows={5}
      />

      {/* Warning text muncul di bawah textarea */}
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
        {/* Tombol Bersihkan hanya muncul jika hasil sudah tampil */}
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
