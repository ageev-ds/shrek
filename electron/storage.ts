// Работа с файлами пользователя: gameData.json, session.json, папка assets/.
import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import log from 'electron-log/main';
import defaultGameRaw from '../src/data/defaultGame.json';
import { normalizeGame, type Category, type GameData } from '../src/types/game';

export const ASSET_PREFIX = 'asset://local/';

const MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

export const paths = {
  get root() {
    return app.getPath('userData');
  },
  get game() {
    return path.join(this.root, 'gameData.json');
  },
  get backup() {
    return path.join(this.root, 'gameData.backup.json');
  },
  get session() {
    return path.join(this.root, 'session.json');
  },
  get assets() {
    return path.join(this.root, 'assets');
  },
};

export function defaultGame(): GameData {
  const raw = structuredClone(defaultGameRaw) as unknown as GameData;
  return normalizeGame(raw, raw);
}

function writeAtomic(file: string, content: string | Buffer) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

export function loadGame(): GameData {
  fs.mkdirSync(paths.assets, { recursive: true });
  if (!fs.existsSync(paths.game)) {
    log.info('Первый запуск: создаю gameData.json из дефолтной игры');
    const g = defaultGame();
    saveGame(g);
    return g;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(paths.game, 'utf8'));
    const game = normalizeGame(raw, defaultGame());
    collectGarbage(game);
    return game;
  } catch (err) {
    const broken = path.join(paths.root, `gameData.broken-${Date.now()}.json`);
    log.error('gameData.json повреждён, сохраняю копию в', broken, err);
    fs.copyFileSync(paths.game, broken);
    const g = defaultGame();
    saveGame(g);
    return g;
  }
}

export function saveGame(game: GameData) {
  writeAtomic(paths.game, JSON.stringify(game, null, 2));
}

export function backupGame() {
  if (fs.existsSync(paths.game)) fs.copyFileSync(paths.game, paths.backup);
}

export function resetGame(): GameData {
  backupGame();
  const g = defaultGame();
  saveGame(g);
  return g;
}

// ---------- ассеты ----------

export function assetFileFromUrl(url: string): string | null {
  if (!url.startsWith(ASSET_PREFIX)) return null;
  const name = decodeURIComponent(url.slice(ASSET_PREFIX.length));
  // Только плоские имена файлов внутри assets/ — никаких ../
  if (!/^[a-z0-9-]+\.[a-z0-9]+$/i.test(name)) return null;
  return path.join(paths.assets, name);
}

export function importAsset(bytes: ArrayBuffer | Buffer, ext: string): string {
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  if (!MIME[safeExt]) throw new Error(`Неподдерживаемый формат: ${ext}`);
  const name = `${crypto.randomUUID()}.${safeExt}`;
  fs.mkdirSync(paths.assets, { recursive: true });
  fs.writeFileSync(path.join(paths.assets, name), Buffer.from(bytes as ArrayBuffer));
  log.info('Загружен ассет', name);
  return ASSET_PREFIX + name;
}

function referencedAssets(game: GameData): Set<string> {
  const used = new Set<string>();
  const json = JSON.stringify(game);
  const re = /asset:\/\/local\/([a-z0-9-]+\.[a-z0-9]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(json))) used.add(m[1]);
  return used;
}

/** Удаляет из assets/ файлы, на которые игра больше не ссылается. Вызывается при старте. */
function collectGarbage(game: GameData) {
  const used = referencedAssets(game);
  for (const f of fs.readdirSync(paths.assets)) {
    if (!used.has(f)) {
      try {
        fs.unlinkSync(path.join(paths.assets, f));
        log.info('Удалён неиспользуемый ассет', f);
      } catch (e) {
        log.warn('Не удалось удалить ассет', f, e);
      }
    }
  }
}

// ---------- экспорт / импорт (картинки встраиваются в JSON как data URL) ----------

function mapStrings<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === 'string') return fn(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = mapStrings(v, fn);
    return out as T;
  }
  return value;
}

export function embedAssets<T>(value: T): T {
  return mapStrings(value, (s) => {
    const file = assetFileFromUrl(s);
    if (!file || !fs.existsSync(file)) return s;
    const ext = path.extname(file).slice(1).toLowerCase();
    return `data:${MIME[ext] ?? 'application/octet-stream'};base64,${fs.readFileSync(file).toString('base64')}`;
  });
}

export function extractAssets<T>(value: T): T {
  return mapStrings(value, (s) => {
    const m = /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,(.+)$/s.exec(s);
    if (!m) return s;
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1] === 'svg+xml' ? 'svg' : m[1];
    return importAsset(Buffer.from(m[2], 'base64'), ext);
  });
}

export interface ExportFile {
  format: 'shrek-jeopardy';
  kind: 'game' | 'category';
  exportedAt: string;
  game?: GameData;
  category?: Category;
}

export function buildExport(kind: 'game', payload: GameData): ExportFile;
export function buildExport(kind: 'category', payload: Category): ExportFile;
export function buildExport(kind: 'game' | 'category', payload: GameData | Category): ExportFile {
  const base = { format: 'shrek-jeopardy' as const, kind, exportedAt: new Date().toISOString() };
  return kind === 'game'
    ? { ...base, game: embedAssets(payload as GameData) }
    : { ...base, category: embedAssets(payload as Category) };
}

export function parseGameImport(text: string): GameData {
  const data = JSON.parse(text);
  // Поддерживаем и обёртку экспорта, и «голый» gameData.json
  const raw = data?.format === 'shrek-jeopardy' ? data.game : data;
  if (!raw || !Array.isArray(raw.categories)) throw new Error('В файле нет игры (не найдено поле categories)');
  return normalizeGame(extractAssets(raw), defaultGame());
}

export function parseCategoryImport(text: string): Category {
  const data = JSON.parse(text);
  const raw = data?.format === 'shrek-jeopardy' ? data.category : data;
  if (!raw || typeof raw !== 'object' || !raw.cells) throw new Error('В файле нет категории (не найдено поле cells)');
  return extractAssets(raw as Category);
}

// ---------- сессия ----------

export function loadSession(): unknown | null {
  try {
    return fs.existsSync(paths.session) ? JSON.parse(fs.readFileSync(paths.session, 'utf8')) : null;
  } catch {
    return null;
  }
}

export function saveSession(data: unknown) {
  writeAtomic(paths.session, JSON.stringify(data));
}

export function clearSession() {
  fs.rmSync(paths.session, { force: true });
}
