"use client";

import { useState } from "react";

interface ResearchResult {
  title: string;
  summary: string;
  keyPoints?: string[];
  content: string;
  sources?: { title: string; link: string }[];
}

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generateResearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate research");
      }

      const data = await response.json();
      setResult(data);

    } catch (error) {
      console.error("Research error:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("query", query);
      formData.append("exportPdf", "true");

      const response = await fetch("/api/research", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${query.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_research.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("PDF download error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#011433] to-[#04080f] text-white p-10">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold mb-6">
          Research Assistant
        </h1>

        {/* INPUT */}
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter research topic..."
            className="w-full px-4 py-3 rounded-xl bg-white/20 border border-transparent outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40 transition"
          />

          <div className="flex gap-4 mt-4">
            <button
              onClick={generateResearch}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2 rounded-xl hover:scale-105 transition disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            <button
              onClick={downloadPDF}
              disabled={loading}
              className="bg-indigo-600 px-6 py-2 rounded-xl hover:scale-105 transition disabled:opacity-50"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* OUTPUT */}
        {result && (
          <div className="mt-8 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-xl space-y-6">

            <h2 className="text-3xl font-bold">
              {result.title}
            </h2>

            <div>
              <h3 className="text-xl font-semibold mb-2">Summary</h3>
              <p className="opacity-90">{result.summary}</p>
            </div>

            {result.keyPoints && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Key Points</h3>
                <ul className="list-disc pl-6 space-y-2">
                  {result.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-2">Full Research</h3>
              <p className="opacity-90 whitespace-pre-line">
                {result.content}
              </p>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Sources</h3>
                <ul className="list-disc pl-6 space-y-1">
                  {result.sources.map((source, index) => (
                    <li key={index}>
                      <a
                        href={source.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}