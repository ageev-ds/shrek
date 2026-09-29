import { app, BrowserWindow, dialog, ipcMain, net, protocol, session, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import log from 'electron-log/main';
import {
  assetFileFromUrl,
  backupGame,
  buildExport,
  clearSession,
  importAsset,
  loadGame,
  loadSession,
  parseCategoryImport,
  parseGameImport,
  paths,
  resetGame,
  saveGame,
  saveSession,
} from './storage';
import type { Category, GameData } from '../src/types/game';

// Данные всегда в %APPDATA%/shrek-jeopardy, независимо от productName
app.setName('shrek-jeopardy');
app.setPath('userData', path.join(app.getPath('appData'), 'shrek-jeopardy'));
if (process.env.SHREK_USER_DATA) app.setPath('userData', process.env.SHREK_USER_DATA);

log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');
log.transports.file.maxSize = 5 * 1024 * 1024;
log.initialize();
log.errorHandler.startCatching();
log.info(`Запуск ${app.getName()} ${app.getVersion()}, Electron ${process.versions.electron}, ${process.platform}`);

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIR = path.join(__dirname, '..', 'dist-renderer');

protocol.registerSchemesAsPrivileged([
  { scheme: 'asset', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();

let win: BrowserWindow | null = null;

function createWindow() {
  const windowed = process.env.SHREK_WINDOWED === '1';
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    fullscreen: !windowed,
    backgroundColor: '#1f3317',
    title: 'Своя игра: Шрек',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });
  win.setMenu(null);
  win.once('ready-to-show', () => win?.show());

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win?.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      win?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Никаких новых окон и переходов на внешние адреса
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => {
    if (DEV_URL && url.startsWith(DEV_URL)) return;
    e.preventDefault();
  });
  win.webContents.on('render-process-gone', (_e, d) => log.error('Renderer упал', d));
  win.webContents.on('console-message', (e) => {
    const level = (e as unknown as { level: string }).level;
    if (level === 'error' || level === 'warning') log.warn('[renderer]', (e as unknown as { message: string }).message);
  });

  if (DEV_URL) win.loadURL(DEV_URL);
  else win.loadFile(path.join(RENDERER_DIR, 'index.html'));
}

function lockDownNetwork() {
  const allowed = ['file:', 'asset:', 'devtools:', 'data:', 'blob:', 'chrome-extension:'];
  session.defaultSession.webRequest.onBeforeRequest((details, cb) => {
    const url = details.url;
    const ok = allowed.some((p) => url.startsWith(p)) || (DEV_URL && url.startsWith('http://localhost')) || (DEV_URL && url.startsWith('ws://localhost'));
    if (!ok) log.warn('Заблокирован сетевой запрос', url);
    cb({ cancel: !ok });
  });
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
}

function registerAssetProtocol() {
  protocol.handle('asset', (req) => {
    const file = assetFileFromUrl(req.url);
    if (!file || !fs.existsSync(file)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

const JSON_FILTER = [{ name: 'Своя игра (JSON)', extensions: ['json'] }];

function registerIpc() {
  ipcMain.handle('game:load', () => loadGame());
  ipcMain.handle('game:save', (_e, game: GameData) => {
    saveGame(game);
    return true;
  });
  ipcMain.handle('game:reset', () => {
    log.info('Сброс игры к дефолту');
    return resetGame();
  });

  ipcMain.handle('asset:import', (_e, bytes: ArrayBuffer, ext: string) => importAsset(bytes, ext));

  ipcMain.handle('game:export', async (_e, game: GameData) => {
    const r = await dialog.showSaveDialog(win!, {
      title: 'Экспорт игры',
      defaultPath: `svoya-igra-shrek-${new Date().toISOString().slice(0, 10)}.json`,
      filters: JSON_FILTER,
    });
    if (r.canceled || !r.filePath) return null;
    fs.writeFileSync(r.filePath, JSON.stringify(buildExport('game', game), null, 2));
    log.info('Игра экспортирована в', r.filePath);
    return r.filePath;
  });

  ipcMain.handle('game:import', async () => {
    const r = await dialog.showOpenDialog(win!, { title: 'Импорт игры', filters: JSON_FILTER, properties: ['openFile'] });
    if (r.canceled || !r.filePaths[0]) return null;
    const game = parseGameImport(fs.readFileSync(r.filePaths[0], 'utf8'));
    backupGame();
    saveGame(game);
    log.info('Игра импортирована из', r.filePaths[0]);
    return game;
  });

  ipcMain.handle('category:export', async (_e, category: Category) => {
    const safe = category.title.replace(/[\\/:*?"<>|]+/g, '').trim() || 'category';
    const r = await dialog.showSaveDialog(win!, { title: 'Экспорт категории', defaultPath: `${safe}.json`, filters: JSON_FILTER });
    if (r.canceled || !r.filePath) return null;
    fs.writeFileSync(r.filePath, JSON.stringify(buildExport('category', category), null, 2));
    return r.filePath;
  });

  ipcMain.handle('category:import', async () => {
    const r = await dialog.showOpenDialog(win!, { title: 'Импорт категории', filters: JSON_FILTER, properties: ['openFile'] });
    if (r.canceled || !r.filePaths[0]) return null;
    return parseCategoryImport(fs.readFileSync(r.filePaths[0], 'utf8'));
  });

  ipcMain.handle('session:load', () => loadSession());
  ipcMain.handle('session:save', (_e, data: unknown) => saveSession(data));
  ipcMain.handle('session:clear', () => clearSession());

  ipcMain.handle('window:toggleFullscreen', () => {
    win?.setFullScreen(!win.isFullScreen());
    return win?.isFullScreen();
  });
  ipcMain.handle('window:isFullscreen', () => win?.isFullScreen() ?? false);
  ipcMain.handle('app:quit', () => app.quit());
  ipcMain.handle('app:openDataFolder', () => shell.openPath(paths.root));
  ipcMain.handle('app:info', () => ({ version: app.getVersion(), dataDir: paths.root }));
  ipcMain.on('log', (_e, level: 'info' | 'warn' | 'error', msg: string) => log[level]('[renderer]', msg));
}

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.whenReady().then(() => {
  lockDownNetwork();
  registerAssetProtocol();
  registerIpc();
  createWindow();
});

app.on('window-all-closed', () => app.quit());
