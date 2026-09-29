// Проигрывание синтезированных звуков через Howler.js.
import { Howl, Howler } from 'howler';
import { ALL_SOUNDS, renderSound, type SoundId } from './synth';

const howls = new Map<SoundId, Howl>();
let enabled = true;
let ready: Promise<void> | null = null;

export function initSounds() {
  if (!ready) {
    ready = Promise.all(
      ALL_SOUNDS.map(async (id) => {
        const src = await renderSound(id);
        howls.set(id, new Howl({ src: [src], format: ['wav'], preload: true, volume: id === 'hover' ? 0.5 : 1 }));
      }),
    ).then(() => undefined);
  }
  return ready;
}

export function setSoundOptions(on: boolean, volume: number) {
  enabled = on;
  Howler.volume(Math.max(0, Math.min(1, volume)));
}

export function play(id: SoundId) {
  if (!enabled) return;
  howls.get(id)?.play();
}
