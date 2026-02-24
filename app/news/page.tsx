"use client";
import Sidebar from "../components/Sidebar";

import { useState, useEffect } from "react";

export default function NewsPage() {
  const [clock, setClock] = useState("");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("—");
  const [title, setTitle] = useState(
    "Your generated article will appear here"
  );
  const [body, setBody] = useState(
    "AI generated content will be displayed inside this card with a news-like style."
  );
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateNews = async () => {
    if (!topic.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/news?topic=${encodeURIComponent(topic)}`
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch news");
      }

      const data = await res.json();

      setDate(new Date().toLocaleString());
      setTitle(`News about ${data.topic}`);
      setBody(data.summary);
      setArticles(data.news || []);

    } catch (error: any) {
      console.error(error);
      setTitle("Error");
      setBody(error.message || "Something went wrong.");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const copyNews = () => {
    navigator.clipboard.writeText(body);
    alert("Copied!");
  };

  return (
    <div
      className="min-h-screen flex text-white"
      style={{
        background:
          "linear-gradient(to bottom right, #011433, #04080f)",
      }}
    >
      <main className="flex-1 p-10">
        
        {/* HEADER */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              News Generator
            </h1>
            <p className="opacity-70">
              Create short news-style articles
            </p>
          </div>
          <div className="text-sm opacity-70">
            {clock}
          </div>
        </div>

        {/* GENERATOR CARD */}
        <div className="bg-white/10 p-6 rounded-2xl w-full">

          {/* INPUT */}
          <label className="text-sm opacity-70">
            Topic
          </label>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic or headline..."
            className="w-full mt-2 mb-6 px-4 py-3 rounded-xl bg-white/20 border border-transparent outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40 transition-all duration-300"
          />

          {/* BUTTONS */}
          <div className="flex gap-4">
            <button
              onClick={generateNews}
              className="bg-purple-600 px-6 py-2 rounded-xl disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            <button
              onClick={copyNews}
              className="bg-white/20 px-6 py-2 rounded-xl"
            >
              Copy
            </button>
          </div>

          {/* OUTPUT CARD */}
          <div className="bg-white/20 mt-6 p-6 rounded-xl max-h-[400px] overflow-y-auto">

            <div className="text-sm opacity-70">
              {date}
            </div>

            <h3 className="text-xl font-semibold mt-2">
              {title}
            </h3>

            <p className="opacity-80 mt-3">
              {body}
            </p>

            {/* RELATED ARTICLES */}
            {articles.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">
                  Related Articles
                </h4>

                <div className="flex flex-col gap-3">
                  {articles.map((item, index) => (
                    <a
                      key={index}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/10 p-3 rounded-lg hover:bg-white/20 transition"
                    >
                      <div className="font-medium">
                        {item.title}
                      </div>
                      <div className="text-xs opacity-70">
                        {item.source} • {item.pubDate}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}