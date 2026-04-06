'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ---------------- HOVER PARALLAX CARD ---------------- */
import type { ReactNode } from 'react';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
}

const InteractiveCard = ({ children, className }: InteractiveCardProps) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={className}
    >
      <div style={{ transform: 'translateZ(50px)' }}>{children}</div>
    </motion.div>
  );
};

/* ---------------- SUN PATH ARC ---------------- */

interface SunPathArcProps {
  sunrise?: number;
  sunset?: number;
}

const SunPathArc = ({ sunrise, sunset }: SunPathArcProps) => {
  const [sunPos, setSunPos] = useState({ x: 100, y: 90 });

  const formatTime = (unix?: number) => {
    if (!unix) return '--:--';
    return new Date(unix * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (!sunrise || !sunset) return;
    const update = () => {
      const now = Date.now() / 1000;
      const progress = Math.max(
        0,
        Math.min(1, (now - sunrise) / (sunset - sunrise))
      );
      const angle = Math.PI + progress * -Math.PI;
      setSunPos({
        x: 100 + 75 * Math.cos(angle),
        y: 90 - 75 * Math.sin(angle),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [sunrise, sunset]);

  return (
    <motion.div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3.5rem] border border-white/10 flex flex-col justify-between h-full min-h-[300px]">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.4em] text-white">
        <span>Sun Rise</span>
        <span>Sun Set</span>
      </div>
      <svg viewBox="0 0 200 120" className="w-full">
        <path
          d="M 25 90 A 75 75 0 0 1 175 90"
          fill="none"
          stroke="white"
          strokeOpacity="0.5"
          strokeWidth="3"
          strokeDasharray="4 6"
        />
        <motion.circle
          animate={{ cx: sunPos.x, cy: sunPos.y }}
          transition={{ type: 'spring', stiffness: 40 }}
          r="8"
          fill="#fbbf24"
          style={{ filter: 'drop-shadow(0 0 20px #fbbf24)' }}
        />
      </svg>
      <div className="flex justify-between text-xs font-mono text-white italic">
        <span>{formatTime(sunrise)}</span>
        <span>{formatTime(sunset)}</span>
      </div>
    </motion.div>
  );
};

/* ---------------- MAIN DASHBOARD ---------------- */
export default function WeatherDashboard() {
  const pathname = usePathname();
  const [location, setLocation] = useState('Jalpaiguri, India');
  const [searchInput, setSearchInput] = useState('');
  type WeatherData = {
    temperature: number;
    humidity: number;
    description: string;
    windSpeed: number;
    sunrise: number;
    sunset: number;
  };

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `/api/weather?location=${encodeURIComponent(location)}`
        );
        const data = await res.json();
        if (res.ok) setWeatherData(data.weather);
      } catch (e) {
        console.error(e);
      }
    };
    fetchWeather();
  }, [location]);

  const getWeatherEmoji = (description?: string) => {
    if (!description) return '🌤️';

    const text = description.toLowerCase();

    if (text.includes('sun')) return '☀️';
    if (text.includes('cloud')) return '☁️';
    if (text.includes('rain')) return '🌧️';
    if (text.includes('snow')) return '❄️';
    if (text.includes('mist') || text.includes('fog')) return '🌫️';
    if (text.includes('storm') || text.includes('thunder')) return '⛈️';

    return '🌤️';
  };

  return (
    <div className="relative min-h-screen text-white font-sans bg-gradient-to-br from-[#05000a] via-[#0a0014] to-black pb-20 overflow-hidden">
      {/* --- RE-STRUCTURED HEADER --- */}
      <header className="flex justify-between items-center px-12 py-8 sticky top-0 z-50 backdrop-blur-md">
        {/* LEFT: BRAND LOGO */}
        <div className="flex items-center gap-4 group cursor-pointer min-w-fit">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-purple-500/30 blur-xl rounded-2xl group-hover:bg-cyan-500/40 transition-colors duration-500" />
            <div className="relative w-12 h-12 bg-gradient-to-br from-[#8b5cf6] via-[#6366f1] to-[#06b6d4] rounded-[14px] flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-300">
              <span className="font-[1000] text-black text-[14px] tracking-tighter leading-none">
                SAIP
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-[22px] font-bold tracking-tight text-white leading-[1.1]">
              Smart AI Pin
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-[9px] font-bold text-[#22c55e] tracking-[0.1em] uppercase">
                System Online
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: PILL NAVIGATION */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
          {[
            { name: 'Research', href: '/chat' },
            { name: 'News', href: '/news' },
            { name: 'Weather', href: '/temparature' },
            { name: 'Smart Vision', href: '/iot-camera' },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`px-8 py-2.5 text-sm font-medium transition-all rounded-full ${
                pathname === item.href
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* RIGHT: ACTION BUTTON */}
        <div className="flex items-center">
          <button className="bg-white text-black px-8 py-2.5 rounded-full text-sm font-black hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-lg">
            Get Started
          </button>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <main className="max-w-7xl mx-auto px-10 pt-16">
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-end mb-16"
        >
          <div>
            <h2 className="text-5xl font-black tracking-tighter italic uppercase leading-none">
              {location}
            </h2>
            <p className="text-[10px] tracking-[0.5em] text-purple-500 font-bold uppercase mt-4">
              Atmospheric Intelligence Feed
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!searchInput.trim()) return;
              setLocation(searchInput.trim());
              setSearchInput('');
            }}
            className="relative"
          >
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-4 px-8 w-80 outline-none focus:border-purple-500 transition-all font-mono text-sm backdrop-blur-md"
              placeholder="Enter coordinates..."
            />
          </form>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 relative overflow-hidden"
          >
            <div className="relative z-10">
              <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase block mb-4">
                Local Surface Temp
              </span>
              <h3 className="text-[15rem] font-black leading-none tracking-tighter italic">
                {weatherData ? `${weatherData.temperature}°` : '24°'}
              </h3>
              <div className="mt-12 bg-purple-600 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest w-fit">
                {weatherData?.description || 'RAINY'}
              </div>
            </div>
            <motion.div
              animate={{ rotate: [0, 5, 0], y: [0, -15, 0] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -right-10 top-0 text-[18rem] opacity-80 pointer-events-none"
            >
              {getWeatherEmoji(weatherData?.description)}
            </motion.div>
          </motion.div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <SunPathArc
              sunrise={weatherData?.sunrise}
              sunset={weatherData?.sunset}
            />
            <InteractiveCard className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-12 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 mb-8">
                Humidity
              </p>
              <h4 className="text-7xl font-black italic">
                {weatherData ? weatherData.humidity : '23'}%
              </h4>
              <div className="w-full bg-white/10 h-1.5 mt-8 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${weatherData?.humidity || 23}%` }}
                  className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
                />
              </div>
            </InteractiveCard>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="lg:col-span-12 bg-white/5 backdrop-blur-md rounded-[3.5rem] border border-white/5 p-12 flex justify-between items-center"
          >
            <div className="space-y-2">
              <p className="text-[10px] tracking-[0.5em] text-white/20 uppercase font-black">
                Wind Velocity
              </p>
              <h5 className="text-5xl font-black italic">
                {weatherData ? weatherData.windSpeed : '14.2'}
                <span className="text-sm not-italic opacity-30 ml-2">m/s</span>
              </h5>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="text-6xl opacity-80"
            >
              🌀
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
