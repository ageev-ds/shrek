/// <reference types="vite/client" />
import type { ShrekApi } from '../../electron/preload';

declare global {
  interface Window {
    api: ShrekApi;
  }
}
export {};
