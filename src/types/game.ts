// Единая схема данных игры. Используется и в renderer, и в main-процессе.

export const SCHEMA_VERSION = 1;

export type AvatarId =
  | 'shrek'
  | 'fiona'
  | 'donkey'
  | 'puss'
  | 'dragon'
  | 'pinocchio'
  | 'gingy'
  | 'farquaad'
  | 'wolf'
  | 'mice'
  | 'godmother'
  | 'kitty'
  | 'pig'
  | 'rumple';

export type ScreenSlot = 'menu' | 'board' | 'question' | 'finale';

export interface Question {
  id: string;
  text: string;
  answer: string;
  /** 'asset://local/<file>' — загруженная картинка, 'builtin:<id>' — встроенная иллюстрация */
  image?: string;
  /** Своя цена вопроса; если не задана — цена уровня */
  valueOverride?: number;
  /** Свой таймер в секундах; если не задан — из настроек */
  timerSec?: number;
  catInBag?: boolean;
  auction?: boolean;
  noRisk?: boolean;
  doubleStake?: boolean;
  /** Плейсхолдер, который нужно заменить своим вопросом («Замени меня!») */
  isPlaceholder?: boolean;
  /** Факт стоит перепроверить (аналог комментария // verify) */
  verify?: boolean;
  /** Комментарий для редактора, в игре не показывается */
  note?: string;
}

export interface Level {
  id: string;
  value: number;
}

export interface Category {
  id: string;
  title: string;
  emoji: string;
  color: string;
  /** Ключ — id уровня. В клетке может быть несколько вопросов: в игре берётся случайный. */
  cells: Record<string, Question[]>;
}

export interface Background {
  id: string;
  name: string;
  /** Для встроенных — путь к файлу в public, для загруженных — asset://local/<file> */
  src: string;
  builtin?: boolean;
}

export interface DefaultTeam {
  name: string;
  avatar: AvatarId;
}

export interface Settings {
  defaultTimerSec: number;
  catInBagTimerSec: number;
  auctionTimerSec: number;
  soundEnabled: boolean;
  volume: number;
  devPassword: string;
  wrongAnswerPenalty: boolean;
  /** Показывать значки «Кот в мешке» и «Аукцион» на игровом поле заранее */
  revealSpecialsOnBoard: boolean;
}

export interface GameData {
  schemaVersion: number;
  meta: { title: string; subtitle: string };
  settings: Settings;
  levels: Level[];
  categories: Category[];
  backgrounds: {
    library: Background[];
    active: Record<ScreenSlot, string>;
    blur: number;
    dim: number;
  };
  defaultTeams: DefaultTeam[];
}

export const DEFAULT_SETTINGS: Settings = {
  defaultTimerSec: 30,
  catInBagTimerSec: 45,
  auctionTimerSec: 40,
  soundEnabled: true,
  volume: 0.7,
  devPassword: '',
  wrongAnswerPenalty: true,
  revealSpecialsOnBoard: true,
};

export const BUILTIN_BACKGROUNDS: Background[] = [
  { id: 'bg-swamp', name: 'Болото на закате', src: 'backgrounds/swamp.svg', builtin: true },
  { id: 'bg-castle', name: 'Замок Дракона', src: 'backgrounds/castle.svg', builtin: true },
  { id: 'bg-kingdom', name: 'Тридевятое королевство', src: 'backgrounds/kingdom.svg', builtin: true },
  { id: 'bg-tavern', name: 'Таверна «Ядовитое яблоко»', src: 'backgrounds/tavern.svg', builtin: true },
];

/** Сохранённая партия — для «Продолжить игру» после случайного закрытия */
export interface SessionTeam {
  id: string;
  name: string;
  avatar: AvatarId;
  score: number;
}

export interface AnswerLogEntry {
  teamId: string;
  categoryId: string;
  levelId: string;
  delta: number;
  correct: boolean;
}

export interface SessionSnapshot {
  teams: SessionTeam[];
  activeTeamId: string | null;
  played: string[];
  log: AnswerLogEntry[];
  savedAt: number;
}

/** Дополняет недостающие поля — чтобы старые или неполные JSON импортировались без ошибок */
export function normalizeGame(raw: unknown, fallback: GameData): GameData {
  const r = (raw ?? {}) as Partial<GameData>;
  const levels = Array.isArray(r.levels) && r.levels.length ? r.levels : fallback.levels;
  const categories = Array.isArray(r.categories) ? r.categories : fallback.categories;
  const library = [
    ...BUILTIN_BACKGROUNDS,
    ...((r.backgrounds?.library ?? []) as Background[]).filter((b) => !b.builtin),
  ];
  const active = { ...fallback.backgrounds.active, ...(r.backgrounds?.active ?? {}) };
  for (const slot of Object.keys(active) as ScreenSlot[]) {
    if (!library.some((b) => b.id === active[slot])) active[slot] = fallback.backgrounds.active[slot];
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { ...fallback.meta, ...(r.meta ?? {}) },
    settings: { ...DEFAULT_SETTINGS, ...(r.settings ?? {}) },
    levels: levels.map((l) => ({ id: String(l.id), value: Number(l.value) || 0 })),
    categories: categories.map((c) => {
      const cells: Record<string, Question[]> = {};
      for (const l of levels) {
        cells[l.id] = (c.cells?.[l.id] ?? []).map((q) => ({
          ...q,
          id: String(q.id),
          text: String(q.text ?? ''),
          answer: String(q.answer ?? ''),
        }));
      }
      return {
        id: String(c.id),
        title: String(c.title ?? 'Категория'),
        emoji: String(c.emoji ?? '⭐'),
        color: String(c.color ?? '#6b8e23'),
        cells,
      };
    }),
    backgrounds: {
      library,
      active,
      blur: Number(r.backgrounds?.blur ?? fallback.backgrounds.blur),
      dim: Number(r.backgrounds?.dim ?? fallback.backgrounds.dim),
    },
    defaultTeams: Array.isArray(r.defaultTeams) ? r.defaultTeams : fallback.defaultTeams,
  };
}
