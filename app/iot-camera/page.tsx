'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type WsMessage =
    | { type: 'connected'; message: string }
    | { type: 'image'; imageUrl: string; publicId: string }
    | { type: 'analysis'; result: string };

type CaptureStatus = 'idle' | 'waiting' | 'received' | 'analyzing';

export default function IotCameraPage() {
    const [status, setStatus] = useState<CaptureStatus>('idle');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);

    // ── WebSocket connection ────────────────────────────────────────────────
    const connectWs = useCallback(() => {
        const ws = new WebSocket('ws://localhost:3001');
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
                // Non-JSON message, ignore
            }
        };

        ws.onclose = () => {
            setWsConnected(false);
            // Auto-reconnect after 3 s
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

    // ── Polling fallback (in case WS isn't connected) ───────────────────────
    useEffect(() => {
        if (status !== 'waiting') return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/iot/upload');
                const data = (await res.json()) as { flag: number; imageUrl: string | null };
                if (data.flag === 0 && data.imageUrl) {
                    setImageUrl(data.imageUrl);
                    setStatus('received');
                    setAnalysisResult(null);
                    clearInterval(interval);
                }
            } catch {
                // ignore polling errors
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [status]);

    // ── Capture button handler ──────────────────────────────────────────────
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
                setErrorMsg('Capture already in progress. Please wait.');
                setStatus('idle');
            } else if (!res.ok) {
                throw new Error(`Server error ${res.status}`);
            }
        } catch (err) {
            setErrorMsg((err as Error).message);
            setStatus('idle');
        }
    };

    // ── AI analyze handler ──────────────────────────────────────────────────
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

            const data = (await res.json()) as { result?: string; error?: string };

            if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

            setAnalysisResult(data.result ?? null);
            setStatus('received');
        } catch (err) {
            setErrorMsg((err as Error).message);
            setStatus('received');
        }
    };

    // ── UI ──────────────────────────────────────────────────────────────────
    const buttonDisabled = status === 'waiting' || status === 'analyzing';

    const statusLabel: Record<CaptureStatus, string> = {
        idle: 'Ready to capture',
        waiting: '⏳ Waiting for IoT device…',
        received: '✅ Image received',
        analyzing: '🤖 AI analysing…',
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col items-center py-16 px-6">
            {/* Header */}
            <header className="w-full max-w-2xl mb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            📷 IoT Camera
                        </h1>
                        <p className="text-zinc-400 mt-1 text-sm">
                            Capture an image from your IoT device and analyse it with AI.
                        </p>
                    </div>
                    {/* WS Indicator */}
                    <div className="flex items-center gap-2 text-xs">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}
                        />
                        <span className={wsConnected ? 'text-emerald-400' : 'text-red-400'}>
                            {wsConnected ? 'WS Live' : 'WS Offline'}
                        </span>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-2xl flex flex-col gap-8">
                {/* Capture Card */}
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
                    <h2 className="text-lg font-semibold mb-4 text-zinc-100">
                        Step 1 — Trigger Capture
                    </h2>

                    <button
                        id="capture-btn"
                        onClick={handleCapture}
                        disabled={buttonDisabled}
                        className="w-full h-14 rounded-xl font-semibold text-base transition-all duration-200
              bg-indigo-600 hover:bg-indigo-500 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
              text-white shadow-md shadow-indigo-900"
                    >
                        {status === 'waiting' ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Waiting for IoT…
                            </span>
                        ) : (
                            '📸 Capture Image'
                        )}
                    </button>

                    {/* Status */}
                    <p className="mt-3 text-sm text-zinc-400 text-center">
                        {statusLabel[status]}
                    </p>

                    {/* Error */}
                    {errorMsg && (
                        <div className="mt-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3">
                            {errorMsg}
                        </div>
                    )}
                </section>

                {/* Image Preview */}
                {imageUrl && (
                    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
                        <h2 className="text-lg font-semibold mb-4 text-zinc-100">
                            Step 2 — Captured Image
                        </h2>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt="IoT captured image"
                            className="w-full rounded-xl object-contain max-h-96 border border-zinc-700"
                        />
                        <p className="mt-2 text-xs text-zinc-500 truncate">{imageUrl}</p>
                    </section>
                )}

                {/* AI Analysis */}
                {imageUrl && (
                    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg">
                        <h2 className="text-lg font-semibold mb-4 text-zinc-100">
                            Step 3 — Ask AI about the Image
                        </h2>

                        <textarea
                            id="prompt-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. What code is shown in this image? Explain it and find relevant documentation."
                            rows={3}
                            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        <button
                            id="analyze-btn"
                            onClick={handleAnalyze}
                            disabled={!prompt.trim() || status === 'analyzing' || status === 'waiting'}
                            className="mt-3 w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200
                bg-emerald-600 hover:bg-emerald-500 active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white shadow-md shadow-emerald-900"
                        >
                            {status === 'analyzing' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                    Analysing…
                                </span>
                            ) : (
                                '🤖 Analyse with AI'
                            )}
                        </button>

                        {/* Result */}
                        {analysisResult && (
                            <div className="mt-5 rounded-xl border border-zinc-700 bg-zinc-800 p-5 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                                    AI Analysis
                                </p>
                                {analysisResult}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}
