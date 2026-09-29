import { AnimatePresence, motion } from 'framer-motion';
import { create } from 'zustand';

interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'error';
}
const useToasts = create<{ list: Toast[] }>(() => ({ list: [] }));
let n = 0;

export function toast(text: string, kind: Toast['kind'] = 'ok') {
  const id = ++n;
  useToasts.setState((s) => ({ list: [...s.list, { id, text, kind }] }));
  setTimeout(() => useToasts.setState((s) => ({ list: s.list.filter((t) => t.id !== id) })), kind === 'error' ? 7000 : 4000);
}

export function Toaster() {
  const list = useToasts((s) => s.list);
  return (
    <div className="toaster">
      <AnimatePresence>
        {list.map((t) => (
          <motion.div
            key={t.id}
            className={`toast ${t.kind}`}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
            data-testid="toast"
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
