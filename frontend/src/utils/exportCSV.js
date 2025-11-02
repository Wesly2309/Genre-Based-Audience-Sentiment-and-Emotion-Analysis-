export const exportToCSV = (data, filename = "analysis_results.csv") => {
  if (!data || data.length === 0) return;

  const headers = [
    "Review",
    "Genre",
    "Sentiment",
    "TopEmotion1",
    "TopEmotion2",
  ];

  const csvRows = [];
  csvRows.push(headers.join(","));

  data.forEach((row) => {
    const topEmotions = Array.isArray(row.Emotions)
      ? row.Emotions.slice(0, 2).map((e) => e.Emotion)
      : [];
    const values = [
      `"${row.Review?.replace(/"/g, '""') || ""}"`,
      Array.isArray(row.Genre) ? row.Genre.join(";") : row.Genre || "",
      row.Sentiment || "",
      topEmotions[0] || "",
      topEmotions[1] || "",
    ];
    csvRows.push(values.join(","));
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
