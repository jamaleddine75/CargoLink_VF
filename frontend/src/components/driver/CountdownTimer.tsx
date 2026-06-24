import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  seconds: number;
  onExpire: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds, onExpire }) => {
  const [remaining, setRemaining] = useState(seconds);
  const total = seconds;

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    
    // Vibrate at 10s and 5s if supported
    if ((remaining === 10 || remaining === 5) && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const percentage = (remaining / total) * 100;
  
  // Color shifts: green (>15s) → amber (>5s) → red (≤5s)
  const strokeColor = remaining > 15 ? '#22C55E' : remaining > 5 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * percentage) / 100}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl font-black ${remaining <= 5 ? 'animate-pulse text-red-500' : 'text-slate-900 dark:text-white'}`}>
          {remaining}
        </span>
      </div>
    </div>
  );
};
