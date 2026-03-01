"use client";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";

export default function ImagePage() {
  const [clock, setClock] = useState("");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState(
    "https://via.placeholder.com/800x450.png?text=Image+Placeholder"
  );
  const [visionMode, setVisionMode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateImage = () => {
    if (!prompt.trim()) {
      alert("Please add a prompt");
      return;
    }

    const newImage = `https://picsum.photos/seed/img-${Date.now()}/800/450`;
    setImageUrl(newImage);

    const mode = localStorage.getItem("aspb_mode");
    setVisionMode(mode === "vision");
  };

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "ai-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex text-white bg-gradient-to-br from-[#011433] to-[#04080f]">
      <main className="flex-1 p-10">
        
        {/* HEADER */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Image Generator
            </h1>
            <p className="opacity-70">
              Generate images from prompts
            </p>
          </div>
          <div className="text-sm opacity-70">
            {clock}
          </div>
        </div>

        {/* GENERATOR CARD */}
        <div className="bg-white/10 p-6 rounded-2xl w-full max-w-5xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          
          <label className="text-sm opacity-70">
            Prompt
          </label>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A beautiful sunset over mountains, cinematic..."
            className="w-full mt-2 mb-4 px-4 py-3 rounded-xl bg-white/20 outline-none"
          />

          <div className="flex gap-4">
            <button
              onClick={generateImage}
              className="bg-purple-600 px-6 py-2 rounded-xl"
            >
              Generate
            </button>

            <button
              onClick={downloadImage}
              className="bg-white/20 px-6 py-2 rounded-xl"
            >
              Download
            </button>
          </div>

          {/* IMAGE OUTPUT */}
          <div className="bg-white/20 mt-6 p-6 rounded-xl text-center">
            <img
              src={imageUrl}
              alt="generated"
              className="max-w-full rounded-lg"
            />

            <div className="text-sm opacity-70 mt-3">
              Vision mode:{" "}
              <strong>
                {visionMode ? "On" : "Off"}
              </strong>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}