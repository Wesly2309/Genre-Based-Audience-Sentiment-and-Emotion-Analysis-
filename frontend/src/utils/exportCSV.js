// utils/exportCSV.js
export const exportToCSV = (data, filename = "analysis_results.csv") => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(","));
  data.forEach((row) => {
    const values = headers.map((header) => {
      const val = row[header];
      return typeof val === "object" ? JSON.stringify(val) : val;
    });
    csvRows.push(values.join(","));
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
