'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TYPES ---
type WsMessage =
  | { type: 'connected'; message: string }
  | { type: 'image'; imageUrl: string; publicId: string }
  | { type: 'analysis'; result: string };

type CaptureStatus = 'idle' | 'waiting' | 'received' | 'analyzing';

// --- COMPONENT: FLOWING MESH BACKGROUND ---
const MeshBackground = ({ loading }: { loading?: boolean }) => {
  const bubbles = [
    { size: 150, left: '10%', top: '60%', delay: 0 },
    { size: 80, left: '25%', top: '75%', delay: 2 },
    { size: 120, left: '40%', top: '55%', delay: 4 },
    { size: 180, left: '85%', top: '70%', delay: 3 },
    { size: 100, left: '75%', top: '15%', delay: 5 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden -z-10 bg-[#05000a]">
      {/* 1. THE GRID SYSTEM */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 2. BACKGROUND GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-900/20 blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px]" />

      {/* 3. FLOATING GLASS BUBBLES */}
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            delay: b.delay,
            ease: 'easeInOut',
          }}
          className="absolute rounded-full border border-white/5 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-[1px]"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            top: b.top,
          }}
        />
      ))}

      {/* 4. LOADING SCAN-LINE (Global) */}
      {loading && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: '100vh' }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent z-10 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        />
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function IotCameraPage() {
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // ── WebSocket Logic ──────────────────────────────────────────────────
  const connectWs = useCallback(() => {
    const hostname = window.location.hostname;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || `${wsProtocol}//${hostname}:3001`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setErrorMsg(null);
    };
    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;
        if (data.type === 'image') {
          setImageUrl(data.imageUrl);
          setStatus('received');
          setAnalysisResult(null);
        }
        if (data.type === 'analysis') {
          setAnalysisResult(data.result);
          setStatus('received');
        }
      } catch {
        /* ignore non-json messages */
      }
    };
    ws.onclose = () => {
      setWsConnected(false);
      setTimeout(connectWs, 3000);
    };
    ws.onerror = () => {
      setWsConnected(false);
      ws.close();
    };
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWs]);

  // ── Polling Fallback ──────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'waiting') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/iot/upload');
        const data = (await res.json()) as {
          flag: number;
          imageUrl: string | null;
        };
        if (data.flag === 0 && data.imageUrl) {
          setImageUrl(data.imageUrl);
          setStatus('received');
          setAnalysisResult(null);
          clearInterval(interval);
        }
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  // ── Action Handlers ──────────────────────────────────────────────────
  const handleCapture = async () => {
    setErrorMsg(null);
    setAnalysisResult(null);
    setImageUrl(null);
    setStatus('waiting');
    try {
      const res = await fetch('/api/iot/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'capture' }),
      });
      if (res.status === 409) {
        setErrorMsg('Capture already in progress.');
        setStatus('idle');
      } else if (!res.ok) throw new Error(`Server error ${res.status}`);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus('idle');
    }
  };

  const handleAnalyze = async () => {
    if (!imageUrl || !prompt.trim()) return;
    setStatus('analyzing');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/iot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setAnalysisResult(data.result ?? null);
      setStatus('received');
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus('received');
    }
  };

  return (
    <div className="relative min-h-screen text-zinc-50 font-sans flex flex-col px-6 overflow-x-hidden">
      {/* THE DYNAMIC BACKGROUND */}
      <MeshBackground
        loading={status === 'waiting' || status === 'analyzing'}
      />

      <nav className="w-full flex justify-between items-center px-8 md:px-16 py-6 sticky top-0 z-50">
        {/* LEFT: BRAND LOGO SECTION */}
        <div className="flex items-center gap-4 group cursor-pointer min-w-fit">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-2xl group-hover:bg-cyan-500/40 transition-colors duration-500" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-[#8b5cf6] via-[#6366f1] to-[#06b6d4] rounded-[14px] flex items-center justify-center shadow-lg">
              <span className="font-[900] text-black text-[16px] tracking-tighter">
                SAIP
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-[22px] font-bold tracking-[-0.03em] text-white">
              Smart AI Pin
            </h1>

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
            { name: 'Research', href: 'chat' },
            { name: 'News', href: 'news' },
            { name: 'Weather', href: 'temparature' },
            { name: 'Smart Vision', href: 'iot-camera' },
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`px-6 py-2 text-sm font-medium rounded-full transition ${
                item.name === 'Smart Vision'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:bg-white/5'
              }`}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* RIGHT: ACTION BUTTON */}
        <div>
          <button className="bg-white text-black px-7 py-2.5 rounded-full text-sm font-bold hover:bg-cyan-400 transition-all">
            Get Started
          </button>
        </div>
      </nav>

      {/* CENTERED PAGE CONTENT */}
      <div className="flex flex-col items-center">
        {/* HEADER SECTION */}
        <header className="w-full flex flex-col items-center text-center mt-20 mb-16 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-gradient-to-br from-cyan-400 to-blue-600 p-3 rounded-xl text-black shadow-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>

            <span
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                wsConnected
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-red-500/30 bg-red-500/10'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  wsConnected ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {wsConnected ? 'Node Live' : 'Node Offline'}
              </span>
            </span>
          </div>

          <h1 className="text-6xl font-black tracking-tight text-white mb-4">
            IoT Vision
          </h1>

          <p className="text-white/40 text-lg max-w-xl">
            Capture real-world data from the Smart AI Pin camera and analyze it
            using AI vision models.
          </p>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="w-full max-w-2xl flex flex-col gap-8 relative z-10">
          {/* STEP 1: TRIGGER CAPTURE */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400/80">
                01 — Command
              </h2>
              <div className="h-px flex-1 bg-white/10 mx-4" />
              <span className="text-[10px] font-mono text-white/20">
                AWAIT_TRIGGER
              </span>
            </div>

            <motion.button
              whileHover={{
                scale: 1.01,
                boxShadow: '0 0 40px rgba(6,182,212,0.2)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCapture}
              disabled={status === 'waiting' || status === 'analyzing'}
              className="w-full h-16 rounded-2xl font-black text-lg transition-all duration-500
              bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl disabled:opacity-20"
            >
              {status === 'waiting' ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
                  Interfacing...
                </span>
              ) : (
                'Capture Frame'
              )}
            </motion.button>

            <p className="mt-4 text-[10px] font-bold text-center uppercase tracking-[0.2em] text-white/20">
              {status === 'idle'
                ? 'Ready for Input'
                : status === 'waiting'
                  ? 'Waiting for IoT Device'
                  : 'Buffer Loaded'}
            </p>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center"
              >
                {errorMsg}
              </motion.div>
            )}
          </motion.section>

          {/* STEP 2: FRAME BUFFER PREVIEW */}
          <AnimatePresence>
            {imageUrl && (
              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-6 shadow-2xl"
              >
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400/80 mb-6">
                  02 — Frame Buffer
                </h2>
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-inner">
                  <img
                    src={imageUrl}
                    alt="Captured Stream"
                    className="w-full object-contain max-h-[450px]"
                  />

                  {/* Visual Scanline for AI Processing */}
                  {status === 'analyzing' && (
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="absolute left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_#22d3ee] z-20"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* STEP 3: COGNITIVE ANALYSIS */}
          <AnimatePresence>
            {imageUrl && (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 shadow-2xl"
              >
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400/80 mb-6">
                  03 — Intelligence
                </h2>

                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask Gemini to analyze this frame..."
                    className="w-full rounded-2xl border border-white/5 bg-black/30 px-6 py-5 text-base text-white placeholder-white/10 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    rows={3}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={!prompt.trim() || status === 'analyzing'}
                  className="mt-6 w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-20"
                >
                  {status === 'analyzing'
                    ? 'Processing Signal...'
                    : 'Execute Vision Analysis'}
                </motion.button>

                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 p-7 rounded-[1.5rem] bg-white/[0.02] border border-white/10 text-sm text-white/70 leading-relaxed"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        Gemini Response
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap font-medium">
                      {analysisResult}
                    </div>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-20 py-10 opacity-20 text-[9px] font-mono tracking-[0.5em] uppercase text-center">
          Secured Node — Major-Project-SGP — 2026
        </footer>
      </div>
    </div>
  );
}
