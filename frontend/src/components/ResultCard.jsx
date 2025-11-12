import React from "react";
import ChartEmotion from "./ChartEmotion";

export default function ResultCard({ result }) {
  if (!result) return null;

  return (
    <div className="mt-4 bg-gradient-to-br from-white to-indigo-50 p-5 rounded-xl shadow-inner border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-indigo-700">Analysis Results</h3>
      </div>

      <div className="mt-2 text-sm text-gray-700 space-y-1">
        {result.Review && (
          <p>
            <strong>Review:</strong>{" "}
            <span className="italic text-gray-800">{result.Review}</span>
          </p>
        )}
        {result.Genre && (
          <p>
            <strong>Genre:</strong>{" "}
            <span className="text-gray-800">
              {Array.isArray(result.Genre)
                ? result.Genre.join(", ")
                : result.Genre}
            </span>
          </p>
        )}
        {result.Sentiment && (
          <p>
            <strong>Sentiment:</strong>{" "}
            <span className="text-indigo-600 font-semibold">
              {result.Sentiment}
            </span>
          </p>
        )}
      </div>

      {result.Emotions?.length > 0 && (
        <div className="mt-3 text-sm text-indigo-700 italic">
          Genre audience{" "}
          <span className="font-semibold">
            {Array.isArray(result.Genre)
              ? result.Genre.join(", ")
              : result.Genre}
          </span>{" "}
          tend to feel dominant emotions such as{" "}
          <span className="font-semibold">
            {result.Emotions.slice(0, 2)
              .map((e) => e.Emotion)
              .join(" dan ")}
          </span>
          .
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Top Emotions
          </h4>
          <ul className="space-y-2">
            {result.Emotions.map((e, idx) => (
              <li
                key={idx}
                className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {e.Emotion}
                  </div>
                  <div className="text-xs text-gray-500">
                    Probability {e.Score}
                  </div>
                </div>
                <div className="text-xs text-gray-500">#{idx + 1}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Emotion Chart
          </h4>
          <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
            <ChartEmotion scores={result.Emotions} />
          </div>
        </div>
      </div>

      {result.Summary && (
        <div className="mt-4 text-sm text-gray-600">
          <strong>In summary:</strong> {result.Summary}
        </div>
      )}
    </div>
  );
}
