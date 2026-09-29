import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGame, useContent } from '../store/content';
import { backgroundSrc } from '../lib/assets';
import { useHotkey } from '../hooks/useHotkey';
import { play } from '../audio/sounds';
import type { ScreenSlot } from '../types/game';
import './ui.css';

/** Фон экрана с параллаксом за мышью, размытием и затемнением из настроек */
export function Backdrop({ slot, parallax = true, fireflies = true }: { slot: ScreenSlot; parallax?: boolean; fireflies?: boolean }) {
  const game = useGame();
  const src = backgroundSrc(game, slot);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });
  const x = useTransform(sx, (v) => v * -28);
  const y = useTransform(sy, (v) => v * -18);
  const fx = useTransform(sx, (v) => v * 40);
  const fy = useTransform(sy, (v) => v * 26);

  useEffect(() => {
    if (!parallax) return;
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [parallax, mx, my]);

  return (
    <div className="backdrop">
      <AnimatePresence initial={false}>
        <motion.div
          key={src}
          className="backdrop-img"
          style={{ backgroundImage: `url("${src}")`, x, y, filter: `blur(${game.backgrounds.blur}px)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>
      <div className="backdrop-dim" style={{ background: `rgba(10, 16, 6, ${game.backgrounds.dim})` }} />
      {fireflies && (
        <motion.div className="fireflies" style={{ x: fx, y: fy }}>
          <Fireflies />
        </motion.div>
      )}
      <div className="backdrop-vignette" />
    </div>
  );
}

function Fireflies({ count = 26 }: { count?: number }) {
  const flies = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: 30 + Math.random() * 70,
        size: 3 + Math.random() * 4,
        dur: 6 + Math.random() * 8,
        delay: Math.random() * -12,
        dx: (Math.random() - 0.5) * 120,
        dy: -40 - Math.random() * 120,
      })),
    [count],
  );
  return (
    <>
      {flies.map((f) => (
        <motion.span
          key={f.id}
          className="firefly"
          style={{ left: `${f.left}%`, top: `${f.top}%`, width: f.size, height: f.size }}
          animate={{ x: [0, f.dx, 0], y: [0, f.dy, 0], opacity: [0, 1, 0.2, 1, 0] }}
          transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </>
  );
}

export function Modal({
  open,
  onClose,
  children,
  width = 640,
  className = '',
  closable = true,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  width?: number | string;
  className?: string;
  closable?: boolean;
}) {
  useHotkey('escape', () => closable && onClose?.(), open);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && closable) onClose?.();
          }}
        >
          <motion.div
            className={`modal wood rivets ${className}`}
            style={{ width }}
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            {closable && onClose && (
              <button className="icon-btn modal-close" onClick={onClose} aria-label="Закрыть">
                ✕
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = 'Да',
  cancelLabel = 'Отмена',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} width={520}>
      <div className="col" style={{ gap: '1.2rem', textAlign: 'center' }}>
        <h2 className="gold-text" style={{ fontSize: '1.8rem' }}>
          {title}
        </h2>
        {text && <div style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>{text}</div>}
        <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
          <button className="btn wood-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? 'red' : ''}`}
            onClick={() => {
              play('click');
              onConfirm();
            }}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/** Число, которое плавно «докручивается» до нового значения */
export function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: 'easeOut',
      onUpdate: (v) => setShown(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return <>{shown.toLocaleString('ru-RU')}</>;
}

export function SavedBadge() {
  const state = useContent((s) => s.saveState);
  const label = { idle: '', saving: 'Сохраняю…', saved: 'Сохранено ✓', error: 'Ошибка сохранения!' }[state];
  return (
    <AnimatePresence mode="wait">
      {label && (
        <motion.span
          key={state}
          className={`saved-badge ${state}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          data-testid="saved-badge"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Логотип: буквы появляются по одной с пружинкой */
export function Logo({ title, subtitle, size = 1 }: { title: string; subtitle?: string; size?: number }) {
  const words = title.split(' ');
  let idx = 0;
  return (
    <div className="logo" style={{ fontSize: `${size * 5.4}rem` }}>
      <h1 aria-label={title}>
        {words.map((w, wi) => (
          <span key={wi} className="logo-word">
            {[...w].map((ch) => {
              const i = idx++;
              return (
                <motion.span
                  key={i}
                  className="logo-letter"
                  initial={{ opacity: 0, y: -80, rotate: -20, scale: 0.4 }}
                  animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.055, type: 'spring', stiffness: 420, damping: 14 }}
                >
                  {ch}
                </motion.span>
              );
            })}
          </span>
        ))}
      </h1>
      {subtitle && (
        <motion.p
          className="logo-sub"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + idx * 0.055 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

/** Прямоугольная «табличка» с заголовком, как вывеска таверны */
export function Plaque({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`plaque ${className}`}>{children}</div>;
}
