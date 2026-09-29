// Безопасный мост между renderer и main: наружу торчат только эти функции.
import { contextBridge, ipcRenderer } from 'electron';
import type { Category, GameData } from '../src/types/game';

const api = {
  loadGame: (): Promise<GameData> => ipcRenderer.invoke('game:load'),
  saveGame: (game: GameData): Promise<boolean> => ipcRenderer.invoke('game:save', game),
  resetGame: (): Promise<GameData> => ipcRenderer.invoke('game:reset'),
  importAsset: (bytes: ArrayBuffer, ext: string): Promise<string> => ipcRenderer.invoke('asset:import', bytes, ext),
  exportGame: (game: GameData): Promise<string | null> => ipcRenderer.invoke('game:export', game),
  importGame: (): Promise<GameData | null> => ipcRenderer.invoke('game:import'),
  exportCategory: (c: Category): Promise<string | null> => ipcRenderer.invoke('category:export', c),
  importCategory: (): Promise<Category | null> => ipcRenderer.invoke('category:import'),
  loadSession: (): Promise<unknown> => ipcRenderer.invoke('session:load'),
  saveSession: (data: unknown): Promise<void> => ipcRenderer.invoke('session:save', data),
  clearSession: (): Promise<void> => ipcRenderer.invoke('session:clear'),
  toggleFullscreen: (): Promise<boolean> => ipcRenderer.invoke('window:toggleFullscreen'),
  isFullscreen: (): Promise<boolean> => ipcRenderer.invoke('window:isFullscreen'),
  quit: (): Promise<void> => ipcRenderer.invoke('app:quit'),
  openDataFolder: (): Promise<string> => ipcRenderer.invoke('app:openDataFolder'),
  info: (): Promise<{ version: string; dataDir: string }> => ipcRenderer.invoke('app:info'),
  log: (level: 'info' | 'warn' | 'error', msg: string) => ipcRenderer.send('log', level, msg),
};

export type ShrekApi = typeof api;

contextBridge.exposeInMainWorld('api', api);
