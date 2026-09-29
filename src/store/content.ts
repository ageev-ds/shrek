// Стор контента игры: вопросы, категории, фоны, настройки. Автосохранение с debounce 500 мс.
import { create } from 'zustand';
import { produce } from 'immer';
import type { GameData } from '../types/game';
import { setSoundOptions } from '../audio/sounds';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface ContentState {
  game: GameData | null;
  saveState: SaveState;
  load: () => Promise<void>;
  replace: (g: GameData, save?: boolean) => void;
  update: (fn: (draft: GameData) => void) => void;
  flush: () => Promise<void>;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useContent = create<ContentState>((set, get) => {
  const persist = async () => {
    const g = get().game;
    if (!g) return;
    set({ saveState: 'saving' });
    try {
      await window.api.saveGame(g);
      set({ saveState: 'saved' });
    } catch (e) {
      window.api.log('error', `Ошибка сохранения: ${String(e)}`);
      set({ saveState: 'error' });
    }
  };
  const schedule = () => {
    if (timer) clearTimeout(timer);
    set({ saveState: 'saving' });
    timer = setTimeout(() => {
      timer = null;
      void persist();
    }, 500);
  };
  const applySound = (g: GameData) => setSoundOptions(g.settings.soundEnabled, g.settings.volume);

  return {
    game: null,
    saveState: 'idle',
    load: async () => {
      const g = await window.api.loadGame();
      applySound(g);
      set({ game: g });
    },
    replace: (g, save = true) => {
      applySound(g);
      set({ game: g });
      if (save) schedule();
    },
    update: (fn) => {
      const cur = get().game;
      if (!cur) return;
      const next = produce(cur, fn);
      applySound(next);
      set({ game: next });
      schedule();
    },
    flush: async () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        await persist();
      }
    },
  };
});

export const useGame = () => useContent((s) => s.game!);
