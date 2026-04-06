'use client';

import { useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';


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

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{
    title: string;
    summary: string;
    content: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false); // New state for PDF generation
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = 'Research';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setResult(null);
    setQuery('');
    setSelectedImage(null);
  };

  // Function to handle PDF Download
  const handleDownload = async () => {
    if (!result || downloading) return;
    setDownloading(true);

    try {
      const formData = new FormData();
      formData.append('query', query || 'Visual Analysis');
      formData.append('exportPdf', 'true'); // Signal backend to return PDF

      if (selectedImage) {
        const res = await fetch(selectedImage);
        const blob = await res.blob();
        formData.append(
          'image',
          new File([blob], 'input.png', { type: blob.type })
        );
      }

      const response = await fetch('/api/research', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('PDF generation failed');

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CatchAi_Research_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const generateResearch = async () => {
    if (!query.trim() && !selectedImage) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (query.trim()) formData.append('query', query);
      if (selectedImage) {
        const res = await fetch(selectedImage);
        const blob = await res.blob();
        formData.append(
          'image',
          new File([blob], 'image.png', { type: blob.type })
        );
      }
      formData.append('exportPdf', 'false');

      const response = await fetch('/api/research', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to fetch research data');
      const data = await response.json();
      setResult(data);
    } catch (error: unknown) {
      setResult({
        title: 'Error',
        summary: 'Something went wrong.',
        content: error instanceof Error ? error.message : 'Unknown error.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Enter for result

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && (query.trim() || selectedImage)) {
      e.preventDefault();
      generateResearch();
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
            { name: 'Smart Vision', href: 'iot-camera' }
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`relative px-6 py-2 text-sm font-medium transition-all rounded-full hover:text-white ${
                item.name === 'Research'
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

      <main className="max-w-4xl mx-auto py-24 px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight">
            Research Assistant
          </h2>
          <p className="text-white/30 text-lg">
            Analyze text queries or visual data with Multi-modal AI.
          </p>
        </div>

        {/* --- MAIN INPUT CARD --- */}
        <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
          {loading && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent z-20"
            />
          )}

          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 relative rounded-2xl overflow-hidden border border-white/10 group"
              >
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full max-h-80 object-cover opacity-60"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-red-500/80 p-2 rounded-full transition-colors backdrop-blur-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                {loading && (
                  <motion.div
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: 'linear',
                    }}
                    className="absolute left-0 w-full h-1 bg-purple-400 shadow-[0_0_15px_#a855f7] z-10"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedImage
                  ? 'Add context to this image...'
                  : 'What would you like to research today?'
              }
              className="w-full bg-transparent text-2xl font-light outline-none border-b border-white/10 pb-6 focus:border-purple-500 transition-all placeholder:text-white/5 pr-12"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-0 bottom-6 text-white/20 hover:text-purple-400 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-12">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateResearch}
              disabled={loading || (!query.trim() && !selectedImage)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-500/20 disabled:opacity-30 transition-all"
            >
              {loading ? 'Analyzing Data...' : 'Generate Analysis'}
            </motion.button>
            {(result || selectedImage) && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleClear}
                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 transition-all font-semibold"
              >
                Clear
              </motion.button>
            )}
          </div>
        </div>

        {/* --- RESULTS SECTION --- */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 p-12 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-xl shadow-2xl relative"
            >
              {/* DOWNLOAD BUTTON (TOP RIGHT) */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="absolute top-10 right-10 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-purple-400 group"
                title="Download Analysis as PDF"
              >
                {downloading ? (
                  <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 group-hover:translate-y-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                )}
              </button>

              <div className="flex justify-between items-start mb-6">
                <h3 className="text-3xl font-bold text-purple-400">
                  {result.title}
                </h3>
                <span className="text-[10px] mr-12 font-mono bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                  AI-GENERATED
                </span>
              </div>
              <div className="space-y-6 text-lg text-white/70 leading-relaxed">
                <p className="italic bg-white/5 p-6 rounded-2xl border-l-4 border-purple-500">
                  {result.summary}
                </p>
                <div className="h-[1px] bg-white/10 w-full" />
                <p className="whitespace-pre-line leading-loose">
                  {result.content}
                </p>

                {/* LARGE FOOTER DOWNLOAD BUTTON */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full mt-8 py-4 rounded-2xl bg-purple-600/10 border border-purple-500/30 text-purple-400 font-bold hover:bg-purple-600/20 transition-all flex items-center justify-center gap-3"
                >
                  {downloading
                    ? 'Generating PDF...'
                    : 'Export Full Research Report'}
                  {!downloading && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
