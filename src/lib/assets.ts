import type { GameData, ScreenSlot } from '../types/game';

/** URL фона для экрана с учётом того, что встроенные фоны лежат в public/ */
export function backgroundSrc(game: GameData, slot: ScreenSlot): string {
  const id = game.backgrounds.active[slot];
  const bg = game.backgrounds.library.find((b) => b.id === id) ?? game.backgrounds.library[0];
  return bg ? assetUrl(bg.src) : '';
}

export const assetUrl = (src: string) => (src.startsWith('asset://') || src.startsWith('data:') ? src : `./${src}`);

/** Ужимает картинку до maxSide по большей стороне и перекодирует в webp */
export async function prepareImage(file: File, maxSide = 1920): Promise<{ bytes: ArrayBuffer; ext: string }> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return { bytes: await file.arrayBuffer(), ext: file.type === 'image/gif' ? 'gif' : 'svg' };
  }
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
  return { bytes: await blob.arrayBuffer(), ext: 'webp' };
}

export async function uploadImage(file: File, maxSide?: number): Promise<string> {
  const { bytes, ext } = await prepareImage(file, maxSide);
  return window.api.importAsset(bytes, ext);
}
