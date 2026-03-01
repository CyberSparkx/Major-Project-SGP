'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

export default function Home() {
  const [hoveredPath, setHoveredPath] = useState('');

  const navItems = [
    { name: 'Research', href: 'chat' },
    { name: 'News', href: 'news' },
    { name: 'Weather', href: 'temparature' },
  ];

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <div className="relative min-h-screen bg-[#06000a] text-white overflow-hidden font-sans selection:bg-purple-500/30">
      {/* --- ENHANCED DYNAMIC BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-purple-900/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.3, 0.1],
            y: [0, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-900/20 rounded-full blur-[150px]"
        />
      </div>

      {/* --- NAVBAR --- */}
      <nav className="flex justify-between items-center px-8 md:px-16 py-8 relative z-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:rotate-12 transition-transform">
            <span className="font-black text-black">SAIP</span>
          </div>
          <span className="text-xl font-bold tracking-tighter">
            Smart AI Pin
          </span>
        </motion.div>

        <div className="hidden md:flex items-center gap-1 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onMouseEnter={() => setHoveredPath(item.name)}
              onMouseLeave={() => setHoveredPath('')}
              className="relative px-6 py-2 text-sm font-medium transition-colors hover:text-white text-white/60"
            >
              <span className="relative z-10">{item.name}</span>
              {item.name === hoveredPath && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-white/10 rounded-full"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                />
              )}
            </a>
          ))}
        </div>

        <button className="bg-white text-black px-6 py-2 rounded-full text-sm font-bold hover:bg-cyan-400 transition-colors hidden md:block">
          Get Started
        </button>
      </nav>

      {/* --- HERO CONTENT --- */}
      <section className="flex flex-col lg:flex-row items-center justify-between px-8 md:px-16 py-12 max-w-7xl mx-auto min-h-[85vh] gap-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="max-w-2xl space-y-8 z-10 text-center lg:text-left"
        >
          <div className="space-y-4">
            <motion.div
              variants={fadeInUp}
              className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase"
            >
              ✨ Next-Gen Intelligence
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9]"
            >
              Meet your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 animate-gradient-x">
                Smart AI Bot
              </span>
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-white/50 text-xl leading-relaxed max-w-lg mx-auto lg:mx-0 font-light"
            >
              The ultimate multi-purpose assistant. Bridging the gap between
              deep research and real-time live data.
            </motion.p>
          </div>

          {/* Cards Section */}
          {/* MISSION & VISION SECTION */}
          {/* MISSION & VISION SECTION */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
          >
            {/* Mission Card */}
            <motion.div
              whileHover={{
                y: -12,
                scale: 1.02,
                boxShadow: '0px 20px 40px rgba(168, 85, 247, 0.15)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md group overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2 tracking-[0.2em] text-xs">
                <span className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_10px_#a855f7] animate-pulse" />
                SYSTEM MISSION
              </h3>

              <p className="text-white/70 text-sm leading-relaxed relative z-10">
                To decentralize complex data processing by providing a
                high-speed Neural Interface that transforms raw global
                information into actionable, AI-synthesized research reports in
                real-time.
              </p>
            </motion.div>

            {/* Vision Card */}
            <motion.div
              whileHover={{
                y: -12,
                scale: 1.02,
                boxShadow: '0px 20px 40px rgba(34, 211, 238, 0.15)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md group overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2 tracking-[0.2em] text-xs">
                <span className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee] animate-pulse" />
                STRATEGIC VISION
              </h3>

              <p className="text-white/70 text-sm leading-relaxed relative z-10">
                To establish a definitive Global Intelligence Command Center—a
                seamless convergence point where live atmospheric telemetry,
                geopolitical shifts, and deep-learning research exist in a
                single interface.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* --- ROBOT IMAGE AREA --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          {/* Decorative Orbital Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-white/5 rounded-full animate-[spin_20s_linear_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] border border-white/[0.02] rounded-full animate-[spin_30s_linear_infinite_reverse]" />

          {/* Floating Processing Tags */}
          {
            <>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-4 -right-8 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl text-[10px] font-bold text-cyan-400 z-20"
              >
                ● ANALYZING_DATA
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
                className="absolute bottom-10 -left-12 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl text-[10px] font-bold text-purple-400 z-20"
              >
                STATUS: OPTIMAL
              </motion.div>
            </>
          }

          <motion.div
            animate={{ y: [0, -25, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/robot 1.png"
              alt="AI Bot"
              width={600}
              height={600}
              priority
              className="drop-shadow-[0_0_100px_rgba(168,85,247,0.3)] relative z-10"
            />
          </motion.div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-purple-500/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        </motion.div>
      </section>
    </div>
  );
}
