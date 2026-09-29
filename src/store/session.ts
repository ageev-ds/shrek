// Стор текущей партии: команды, счёт, сыгранные клетки, журнал ответов, открытый вопрос.
import { create } from 'zustand';
import type { AnswerLogEntry, AvatarId, GameData, Question, SessionSnapshot, SessionTeam } from '../types/game';
import { cellKey, pickRandom, uid } from '../lib/ids';

export type QuestionKind = 'normal' | 'cat' | 'auction';

export interface CurrentQuestion {
  categoryId: string;
  levelId: string;
  questionId: string;
  kind: QuestionKind;
  value: number;
  answeringTeamId: string | null;
  tried: string[];
  revealed: boolean;
  resolved: boolean;
  /** Если вопрос был отвечен верно — кем */
  winnerId: string | null;
}

export interface DraftTeam {
  id: string;
  name: string;
  avatar: AvatarId;
}

interface SessionState {
  teams: SessionTeam[];
  activeTeamId: string | null;
  played: string[];
  /** Какой из вариантов вопроса выбран для каждой клетки в этой партии */
  variants: Record<string, string>;
  log: AnswerLogEntry[];
  current: CurrentQuestion | null;
  /** Последнее изменение счёта — для анимации «+300» */
  lastDelta: { teamId: string; delta: number; at: number } | null;

  startGame: (teams: DraftTeam[], game: GameData) => void;
  restart: (game: GameData) => void;
  resume: (snap: SessionSnapshot, game: GameData) => void;
  setActive: (teamId: string) => void;
  open: (categoryId: string, levelId: string, game: GameData) => CurrentQuestion | null;
  setAnswering: (teamId: string, value?: number) => void;
  reveal: () => void;
  judge: (correct: boolean, game: GameData) => void;
  adjustScore: (teamId: string, delta: number) => void;
  close: (markPlayed: boolean) => void;
  clear: () => void;
}

export function findQuestion(game: GameData, categoryId: string, levelId: string, questionId?: string): Question | undefined {
  const cell = game.categories.find((c) => c.id === categoryId)?.cells[levelId] ?? [];
  return cell.find((q) => q.id === questionId) ?? cell[0];
}

export function questionValue(game: GameData, levelId: string, q: Question | undefined) {
  const base = q?.valueOverride ?? game.levels.find((l) => l.id === levelId)?.value ?? 0;
  return q?.catInBag && q.doubleStake ? base * 2 : base;
}

/**
 * Выбор варианта вопроса для клетки. Если в клетке есть «Кот в мешке» или «Аукцион» — берётся он,
 * чтобы спецвопросы гарантированно встречались в каждой партии. Иначе — случайный вариант.
 */
function pickVariants(game: GameData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of game.categories) {
    for (const l of game.levels) {
      const cell = c.cells[l.id] ?? [];
      if (!cell.length) continue;
      const special = cell.filter((q) => q.catInBag || q.auction);
      out[cellKey(c.id, l.id)] = pickRandom(special.length ? special : cell).id;
    }
  }
  return out;
}

function snapshot(s: SessionState): SessionSnapshot & { variants: Record<string, string> } {
  return { teams: s.teams, activeTeamId: s.activeTeamId, played: s.played, log: s.log, variants: s.variants, savedAt: Date.now() };
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistEnabled = true;
export function setSessionPersistence(on: boolean) {
  persistEnabled = on;
}

export const useSession = create<SessionState>((set, get) => {
  const persist = () => {
    if (!persistEnabled) return;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      const s = get();
      if (s.teams.length) void window.api.saveSession(snapshot(s));
    }, 300);
  };
  const setAndPersist = (patch: Partial<SessionState>) => {
    set(patch);
    persist();
  };

  return {
    teams: [],
    activeTeamId: null,
    played: [],
    variants: {},
    log: [],
    current: null,
    lastDelta: null,

    startGame: (teams, game) => {
      setAndPersist({
        teams: teams.map((t) => ({ ...t, id: t.id || uid('team'), score: 0 })),
        activeTeamId: teams[0]?.id ?? null,
        played: [],
        variants: pickVariants(game),
        log: [],
        current: null,
        lastDelta: null,
      });
    },
    restart: (game) => {
      const s = get();
      setAndPersist({
        teams: s.teams.map((t) => ({ ...t, score: 0 })),
        activeTeamId: s.teams[0]?.id ?? null,
        played: [],
        variants: pickVariants(game),
        log: [],
        current: null,
        lastDelta: null,
      });
    },
    resume: (snap, game) => {
      const variants = (snap as SessionSnapshot & { variants?: Record<string, string> }).variants ?? {};
      const fresh = pickVariants(game);
      set({
        teams: snap.teams,
        activeTeamId: snap.activeTeamId ?? snap.teams[0]?.id ?? null,
        played: snap.played,
        log: snap.log,
        variants: { ...fresh, ...variants },
        current: null,
        lastDelta: null,
      });
    },
    setActive: (teamId) => setAndPersist({ activeTeamId: teamId }),

    open: (categoryId, levelId, game) => {
      const key = cellKey(categoryId, levelId);
      const s = get();
      if (s.played.includes(key)) return null;
      const q = findQuestion(game, categoryId, levelId, s.variants[key]);
      if (!q) return null;
      const kind: QuestionKind = q.catInBag ? 'cat' : q.auction ? 'auction' : 'normal';
      const current: CurrentQuestion = {
        categoryId,
        levelId,
        questionId: q.id,
        kind,
        value: questionValue(game, levelId, q),
        answeringTeamId: kind === 'normal' ? s.activeTeamId : null,
        tried: [],
        revealed: false,
        resolved: false,
        winnerId: null,
      };
      set({ current });
      return current;
    },
    setAnswering: (teamId, value) => {
      const c = get().current;
      if (!c) return;
      set({ current: { ...c, answeringTeamId: teamId, value: value ?? c.value } });
    },
    reveal: () => {
      const c = get().current;
      if (c) set({ current: { ...c, revealed: true } });
    },
    judge: (correct, game) => {
      const s = get();
      const c = s.current;
      if (!c || !c.answeringTeamId || c.resolved) return;
      const q = findQuestion(game, c.categoryId, c.levelId, c.questionId);
      const penalty = game.settings.wrongAnswerPenalty && !q?.noRisk;
      const delta = correct ? c.value : penalty ? -c.value : 0;
      const teamId = c.answeringTeamId;
      const entry: AnswerLogEntry = { teamId, categoryId: c.categoryId, levelId: c.levelId, delta, correct };
      setAndPersist({
        teams: s.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + delta } : t)),
        log: [...s.log, entry],
        lastDelta: { teamId, delta, at: Date.now() },
        activeTeamId: correct ? teamId : s.activeTeamId,
        current: correct
          ? { ...c, resolved: true, revealed: true, winnerId: teamId }
          : { ...c, tried: [...c.tried, teamId], answeringTeamId: null },
      });
    },
    adjustScore: (teamId, delta) => {
      const s = get();
      setAndPersist({
        teams: s.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + delta } : t)),
        lastDelta: { teamId, delta, at: Date.now() },
      });
    },
    close: (markPlayed) => {
      const s = get();
      const c = s.current;
      if (!c) return;
      const key = cellKey(c.categoryId, c.levelId);
      setAndPersist({ current: null, played: markPlayed && !s.played.includes(key) ? [...s.played, key] : s.played });
    },
    clear: () => {
      set({ teams: [], activeTeamId: null, played: [], variants: {}, log: [], current: null, lastDelta: null });
      void window.api.clearSession();
    },
  };
});
