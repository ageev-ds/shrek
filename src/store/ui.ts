// Стор интерфейса: текущий экран, режим предпросмотра, доступ к dev-режиму.
import { create } from 'zustand';

export type Screen = 'start' | 'teams' | 'board' | 'question' | 'finale' | 'dev';
export type DevSection = 'categories' | 'questions' | 'backgrounds' | 'teams' | 'settings';

interface UiState {
  screen: Screen;
  preview: boolean;
  devUnlocked: boolean;
  devSection: DevSection;
  devCategoryId: string | null;
  passwordPrompt: boolean;
  settingsOpen: boolean;
  go: (screen: Screen) => void;
  set: (patch: Partial<UiState>) => void;
}

export const useUi = create<UiState>((set) => ({
  screen: 'start',
  preview: false,
  devUnlocked: false,
  devSection: 'questions',
  devCategoryId: null,
  passwordPrompt: false,
  settingsOpen: false,
  go: (screen) => set({ screen }),
  set: (patch) => set(patch),
}));
