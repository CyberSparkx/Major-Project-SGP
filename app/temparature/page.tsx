'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function TemperaturePage() {
  const [celsius, setCelsius] = useState<string>('');
  const [fahrenheit, setFahrenheit] = useState<string>('');

  const handleCelsiusChange = (value: string) => {
    setCelsius(value);

    if (value === '') {
      setFahrenheit('');
      return;
    }

    const f = (parseFloat(value) * 9) / 5 + 32;
    setFahrenheit(f.toFixed(2));
  };

  const handleFahrenheitChange = (value: string) => {
    setFahrenheit(value);

    if (value === '') {
      setCelsius('');
      return;
    }

    const c = ((parseFloat(value) - 32) * 5) / 9;
    setCelsius(c.toFixed(2));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-10 py-32 px-16 bg-white dark:bg-black sm:items-start">
        {/* Logo (Optional) */}
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        {/* Heading */}
        <div className="flex flex-col gap-4 text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Temperature Converter
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Convert between Celsius and Fahrenheit instantly.
          </p>
        </div>

        {/* Converter Card */}
        <div className="w-full max-w-md space-y-6">
          {/* Celsius Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Celsius (°C)
            </label>
            <input
              type="number"
              value={celsius}
              onChange={(e) => handleCelsiusChange(e.target.value)}
              placeholder="Enter Celsius"
              className="h-12 rounded-xl border border-zinc-300 px-4 text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          {/* Fahrenheit Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Fahrenheit (°F)
            </label>
            <input
              type="number"
              value={fahrenheit}
              onChange={(e) => handleFahrenheitChange(e.target.value)}
              placeholder="Enter Fahrenheit"
              className="h-12 rounded-xl border border-zinc-300 px-4 text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
