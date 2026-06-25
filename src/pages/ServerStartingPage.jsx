import { useEffect, useState } from 'react';
import RpLogo from '../components/RpLogo';

const MESSAGES = [
  'Waking up the server…',
  'Still warming up, almost there…',
  'This takes about 30–60 seconds on first load…',
  'Hang tight, server is nearly ready…',
  'Almost done warming up…',
];

export default function ServerStartingPage({ onReady }) {
  const [elapsed, setElapsed] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Tick elapsed seconds
    const tick = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    // Animate dots
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);

    // Rotate messages every 10 seconds
    const msgInterval = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 10000);

    // Poll the health endpoint
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const healthUrl = apiBase.replace(/\/api$/, '') + '/health';
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(healthUrl, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          clearInterval(poll);
          clearInterval(tick);
          clearInterval(dotInterval);
          clearInterval(msgInterval);
          onReady();
        }
      } catch {
        // still starting
      }
    }, 5000);

    return () => {
      clearInterval(tick);
      clearInterval(dotInterval);
      clearInterval(msgInterval);
      clearInterval(poll);
    };
  }, [onReady]);

  // Progress bar: fills to ~90% over 60 seconds, then holds
  const progress = Math.min((elapsed / 60) * 90, 90);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white px-6">
      <div className="flex flex-col items-center gap-6 max-w-xs w-full text-center">
        {/* Pulsing logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-rosewood-100 animate-ping opacity-60 scale-150" />
          <div className="relative h-20 w-20 rounded-full bg-rosewood-50 flex items-center justify-center">
            <RpLogo className="h-12 w-12" />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            Server is starting up
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {MESSAGES[msgIndex]}{dots}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-rosewood-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-gray-400">
          {elapsed}s elapsed &mdash; Render free tier wakes up in ~30–60s after inactivity
        </p>
      </div>
    </div>
  );
}
