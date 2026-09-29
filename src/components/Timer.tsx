import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { play } from '../audio/sounds';

/** Круговой таймер обратного отсчёта. Тикает последние 10 секунд, по окончании — гонг и onExpire. */
export function Timer({ seconds, running, onExpire, size = 120 }: { seconds: number; running: boolean; onExpire: () => void; size?: number }) {
  const [left, setLeft] = useState(seconds);
  const expired = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setLeft(seconds);
    expired.current = false;
  }, [seconds]);

  useEffect(() => {
    if (!running || expired.current) return;
    const started = performance.now();
    const startLeft = left;
    let lastWhole = Math.ceil(startLeft);
    const id = setInterval(() => {
      const l = Math.max(0, startLeft - (performance.now() - started) / 1000);
      setLeft(l);
      const whole = Math.ceil(l);
      if (whole !== lastWhole) {
        lastWhole = whole;
        if (whole <= 10 && whole > 0) play('tick');
      }
      if (l <= 0 && !expired.current) {
        expired.current = true;
        clearInterval(id);
        play('timeUp');
        onExpireRef.current();
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const r = 44;
  const c = 2 * Math.PI * r;
  const frac = seconds > 0 ? left / seconds : 0;
  const urgent = left <= 10;
  const color = left <= 5 ? '#e8604f' : urgent ? '#f39c12' : '#f1c94b';

  return (
    <motion.div
      className="timer"
      style={{ width: size, height: size, position: 'relative' }}
      animate={urgent && running ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={urgent && running ? { duration: 1, repeat: Infinity } : undefined}
      data-testid="timer"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="48" fill="rgba(30,18,11,0.9)" stroke="#1e120b" strokeWidth="3" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke 0.3s', filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: size * 0.34,
          color,
          textShadow: '0 2px 0 rgba(0,0,0,0.6)',
        }}
      >
        {Math.ceil(left)}
      </div>
    </motion.div>
  );
}
