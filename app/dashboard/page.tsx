"use client";



import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Dashboard() {
  const pathname = usePathname();
  const [clock, setClock] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [mode, setMode] = useState("text");

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex text-white"
      style={{
        background:
          "linear-gradient(to bottom right, #011433, #04080f)",
      }}
    >



      {/* MAIN */}
      <main className="flex-1 p-10">
        {/* HEADER */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Dashboard
            </h1>
            <p className="opacity-70">
              Welcome back — AI Smart Pin Bot
            </p>
          </div>
          <div className="text-sm opacity-70">
            {clock}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white/10 p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <span>AI Mode</span>

                  <div className="flex bg-white/20 rounded-full">
                    <button
                      onClick={() => setMode("text")}
                      className={`px-4 py-1 rounded-full ${mode === "text"
                        ? "bg-purple-600"
                        : "opacity-60"
                        }`}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setMode("vision")}
                      className={`px-4 py-1 rounded-full ${mode === "vision"
                        ? "bg-purple-600"
                        : "opacity-60"
                        }`}
                    >
                      Vision
                    </button>
                  </div>

                  <select
                    value={model}
                    onChange={(e) =>
                      setModel(e.target.value)
                    }
                    className="bg-white/20 px-3 py-1 rounded-lg"
                  >
                    <option>gemini-2.5-flash</option>
                    <option>gemini-2.5-pro</option>
                    <option>gemini-vision</option>
                  </select>
                </div>

                <button className="bg-purple-600 px-4 py-2 rounded-lg">
                  Quick Run
                </button>
              </div>

              <div className="mt-6 space-y-2 opacity-80">
                <p>This is a simulated AI reply.</p>
                <p>Manual run</p>
                <p>Today top 5 news in AI...</p>
              </div>
            </div>

            {/* IOT */}
            <div className="bg-white/10 p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
              <h3 className="mb-4">
                Live IoT Camera Feed
              </h3>

              <div className="h-56 bg-white/20 rounded-xl flex items-center justify-center opacity-70">
                Future image captured from IoT
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div className="bg-white/10 p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
              <h3>Account</h3>
              <p className="opacity-70 mt-2">
                Signed in as
              </p>
              <p className="font-semibold">
                user@email.com
              </p>

              <div className="mt-4 flex gap-3">
                <button className="bg-white/20 px-4 py-1 rounded-lg">
                  Usage
                </button>
                <button className="bg-purple-600 px-4 py-1 rounded-lg">
                  Upgrade
                </button>
              </div>
            </div>

            <div className="bg-white/10 p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
              <h3>Quick Actions</h3>

              <div className="flex flex-col gap-3 mt-4">
                <a
                  href="/chat"
                  target="_blank"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 py-2 rounded-lg text-center"
                >
                  Open Chat
                </a>

                <button className="bg-white/20 py-2 rounded-lg">
                  Generate News
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
