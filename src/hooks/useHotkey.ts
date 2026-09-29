// Горячие клавиши со стеком: последний зарегистрированный обработчик клавиши выигрывает.
// Так Esc сначала закрывает модалку, а уже потом — уводит с экрана.
import { useEffect, useRef } from 'react';

type Handler = (e: KeyboardEvent) => void;
const stacks = new Map<string, { id: number; fn: React.MutableRefObject<Handler> }[]>();
let nextId = 0;

export const comboOf = (e: KeyboardEvent) =>
  `${e.ctrlKey || e.metaKey ? 'ctrl+' : ''}${e.shiftKey ? 'shift+' : ''}${e.code === 'Space' ? 'space' : e.key.toLowerCase()}`;

window.addEventListener('keydown', (e) => {
  const tag = (e.target as HTMLElement | null)?.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  const combo = comboOf(e);
  if (typing && combo !== 'escape' && combo !== 'ctrl+shift+d') return;
  const stack = stacks.get(combo);
  const top = stack?.[stack.length - 1];
  if (top) {
    e.preventDefault();
    top.fn.current(e);
  }
});

export function useHotkey(combo: string, handler: Handler, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const id = nextId++;
    const list = stacks.get(combo) ?? [];
    list.push({ id, fn: ref });
    stacks.set(combo, list);
    return () => {
      const l = stacks.get(combo) ?? [];
      stacks.set(
        combo,
        l.filter((x) => x.id !== id),
      );
    };
  }, [combo, enabled]);
}
