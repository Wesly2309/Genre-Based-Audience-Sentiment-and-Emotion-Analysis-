export const exportToCSV = (data, filename = "analysis_results_full.csv") => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("⚠️ No data to export");
    return;
  }

  // Definisi kolom CSV
  const headers = [
    "No",
    "Review",
    "Genre(s)",
    "Sentiment",
    "Emotions (All with Scores)",
  ];

  const csvRows = [];
  csvRows.push(headers.join(","));

  // Escape karakter spesial agar aman di CSV
  const escapeCSV = (text) => {
    if (text === undefined || text === null) return "";
    const value = String(text)
      .replace(/"/g, '""')
      .replace(/\r?\n|\r/g, " ");
    return `"${value}"`;
  };

  data.forEach((row, index) => {
    const review = escapeCSV(row.Review || "");
    const sentiment = escapeCSV(row.Sentiment || "");

    // Pastikan genre lengkap dan gabung dengan separator yang aman
    let genreList = "";
    if (Array.isArray(row.Genre) && row.Genre.length > 0) {
      genreList = row.Genre.join("; ");
    } else if (typeof row.Genre === "string") {
      genreList = row.Genre;
    }
    genreList = escapeCSV(genreList);

    // Ambil SEMUA emosi (tanpa dibatasi top 2)
    let allEmotions = "";
    if (Array.isArray(row.Emotions)) {
      allEmotions = row.Emotions.map((e) => {
        const emotion = e.Emotion || "";
        const score = e.Score !== undefined ? e.Score.toFixed(3) : "0.000";
        return `${emotion}:${score}`;
      }).join("; ");
    }
    allEmotions = escapeCSV(allEmotions);

    // Gabungkan semua kolom
    const rowValues = [
      index + 1, // Nomor urut
      review,
      genreList,
      sentiment,
      allEmotions,
    ];

    csvRows.push(rowValues.join(","));
  });

  // Buat blob CSV untuk diunduh
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);

  // Trigger download
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
