'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

// --- FLOWING MESH GRADIENT COMPONENT ---
const MeshBackground = ({ loading }: { loading?: boolean }) => {
  // Generate fixed bubbles for a consistent look like the screenshot
  const bubbles = [
    { size: 150, left: '10%', top: '60%', delay: 0 },
    { size: 80, left: '25%', top: '75%', delay: 2 },
    { size: 120, left: '40%', top: '55%', delay: 4 },
    { size: 60, left: '30%', top: '20%', delay: 1 },
    { size: 180, left: '85%', top: '70%', delay: 3 },
    { size: 100, left: '75%', top: '15%', delay: 5 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden -z-10 bg-[#05000a]">
      {/* 1. THE GRID SYSTEM (Crucial for that image look) */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px', // Adjust size to match your grid density
        }}
      />

      {/* 2. BACKGROUND GLOWS (Deep Purple/Blue) */}
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-900/20 blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px]" />

      {/* 3. FLOATING GLASS BUBBLES */}
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            y: [0, -20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: b.delay,
            ease: 'easeInOut',
          }}
          className="absolute rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-[2px]"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)',
          }}
        >
          {/* Reflection highlight */}
          <div className="absolute top-[15%] left-[20%] w-[20%] h-[20%] bg-white/20 rounded-full blur-[2px]" />
        </motion.div>
      ))}

      {/* 4. LOADING SCAN-LINE (Horizontal bar that moves down) */}
      {loading && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: '100vh' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent z-10 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
        />
      )}
    </div>
  );
};

type NewsArticle = {
  title: string;
  link?: string;
  url?: string;
  source?: string;
  pubDate?: string;
};

type NewsResult = {
  date: string;
  title: string;
  summary: string;
  articles: NewsArticle[];
};

export default function NewsPage() {
  const [clock, setClock] = useState('');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<NewsResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 Real API Call
  const generateNews = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/news?topic=${encodeURIComponent(topic)}`
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      console.log('API RAW:', data);

      // 🔥 IMPORTANT FIX
      const summary = data.summary;

      // try multiple possible keys safely
      const articles =
        data.articles ||
        data.selectedArticles ||
        data.news ||
        data.data?.articles ||
        [];

      setResult({
        date: new Date().toLocaleString(),
        title: `Intelligence Report: ${topic}`,
        summary,
        articles,
      });
    } catch (error: unknown) {
      setResult({
        date: new Date().toLocaleString(),
        title: 'Error',
        summary: error instanceof Error ? error.message : 'Unknown error',
        articles: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-purple-500/30">
      <MeshBackground />

      {/* --- NAVIGATION --- */}
      <nav className="flex justify-between items-center px-8 md:px-16 py-8 sticky top-0 z-50">
        {/* LEFT: BRAND LOGO SECTION */}
        <div className="flex items-center gap-4 group cursor-pointer min-w-fit">
          {/* The Icon Block - Adjusted for specific width/height ratio */}
          <div className="relative flex-shrink-0">
            {/* Outer Glow Effect */}
            <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-2xl group-hover:bg-cyan-500/40 transition-colors duration-500" />

            {/* Gradient Square Icon - Standardized to 48px (w-12) for visual weight */}
            <div className="relative w-12 h-12 bg-gradient-to-br from-[#8b5cf6] via-[#6366f1] to-[#06b6d4] rounded-[14px] flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-300">
              {/* Width of the text inside is adjusted to be bold and centered */}
              <span className="font-[900] text-black text-[16px] tracking-tighter leading-none mb-0.5">
                SAIP
              </span>
            </div>
          </div>

          {/* Typography - Adjusted spacing and width */}
          <div className="flex flex-col justify-center">
            <h1 className="text-[22px] font-bold tracking-[-0.03em] text-white leading-[1.1]">
              Smart AI Pin
            </h1>
            {/* System Label adjusted to match image_664db4.png */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-green-500/90 tracking-[0.15em] uppercase">
                System Online
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: PILL NAVIGATION */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          {[
            // { name: "Dashboard", href: "#" }, // Added to match the screenshot menu
            { name: 'Research', href: 'chat' },
            { name: 'News', href: 'news' },
            { name: 'Weather', href: 'temparature' },
            { name: 'Smart Vision', href: 'iot-camera' },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`relative px-6 py-2 text-sm font-medium transition-all rounded-full hover:text-white ${
                item.name === 'News'
                  ? 'bg-white/10 text-white' // Active state
                  : 'text-white/50 hover:bg-white/5'
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* RIGHT: ACTION BUTTON */}
        <div className="flex items-center">
          <button className="bg-white text-black px-7 py-2.5 rounded-full text-sm font-bold hover:bg-cyan-400 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Get Started
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-20 px-6 relative z-10">
        {/* HEADER */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight">
              News Generator
            </h2>
            <p className="text-white/40 mt-2 text-lg">
              Synthesizing real-time news into custom articles.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xl font-light text-white/60 tabular-nums">
              {clock}
            </span>
          </div>
        </div>

        {/* INPUT CARD */}
        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden mb-12">
          {loading && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-purple-400 to-transparent"
            />
          )}

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic or headline..."
            className="w-full bg-transparent text-3xl font-light outline-none border-b border-white/10 pb-6 focus:border-purple-500 transition-all placeholder:text-white/5"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateNews}
            disabled={loading}
            className="mt-8 w-full bg-white text-black py-4 rounded-2xl font-bold shadow-xl disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Generate News'}
          </motion.button>
        </div>

        {/* RESULTS */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-xl shadow-2xl"
            >
              <span className="text-xs text-purple-400">{result.date}</span>

              <h3 className="text-4xl font-bold mt-4 mb-8">{result.title}</h3>

              <div className="bg-white/5 p-8 rounded-3xl border-l-4 border-purple-500 italic mb-10">
                {result.summary}
              </div>

              {result.articles.length > 0 && (
                <div>
                  <h4 className="text-sm uppercase text-white/40 mb-6">
                    Cross-Referenced Sources
                  </h4>

                  <div className="grid gap-4">
                    {result.articles.map((item, index) => (
                      <motion.a
                        key={index}
                        href={item.link || item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="block p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/50 hover:bg-white/10 transition-all"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <span className="font-semibold text-white">
                            {item.title}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-white/20 bg-white/5 px-2 py-1 rounded">
                            {item.source}
                          </span>
                        </div>
                        <div className="text-xs text-white/30 mt-2">
                          {item.pubDate}
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
