// Синтез всех звуков игры «на лету» через OfflineAudioContext.
// Результат кодируется в WAV и отдаётся Howler.js — никаких бинарных файлов и сети.

export type SoundId =
  | 'click'
  | 'hover'
  | 'open'
  | 'correct'
  | 'wrong'
  | 'tick'
  | 'timeUp'
  | 'catInBag'
  | 'auction'
  | 'fanfare'
  | 'reveal'
  | 'add'
  | 'remove';

const SR = 44100;

type Render = (ctx: OfflineAudioContext, out: AudioNode) => void;

function noiseBuffer(ctx: BaseAudioContext, seconds: number) {
  const buf = ctx.createBuffer(1, Math.ceil(seconds * ctx.sampleRate), ctx.sampleRate);
  const d = buf.getChannelData(0);
  let seed = 1337;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 16807) % 2147483647;
    d[i] = (seed / 2147483647) * 2 - 1;
  }
  return buf;
}

/** Импульсная характеристика для реверберации — экспоненциально затухающий шум */
function impulse(ctx: BaseAudioContext, seconds: number, decay: number) {
  const len = Math.ceil(seconds * ctx.sampleRate);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let seed = 99 + ch * 7;
    for (let i = 0; i < len; i++) {
      seed = (seed * 16807) % 2147483647;
      d[i] = ((seed / 2147483647) * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function withReverb(ctx: OfflineAudioContext, out: AudioNode, wet = 0.3, seconds = 1.8) {
  const input = ctx.createGain();
  const dry = ctx.createGain();
  dry.gain.value = 1 - wet * 0.5;
  const conv = ctx.createConvolver();
  conv.buffer = impulse(ctx, seconds, 3);
  const wetG = ctx.createGain();
  wetG.gain.value = wet;
  input.connect(dry).connect(out);
  input.connect(conv).connect(wetG).connect(out);
  return input;
}

function env(g: GainNode, t: number, a: number, peak: number, d: number, sustain = 0.0001) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
}

/** Колокольчик: FM-синтез с негармоничным модулятором */
function bell(ctx: OfflineAudioContext, out: AudioNode, freq: number, t: number, dur = 1.2, vol = 0.35) {
  const car = ctx.createOscillator();
  const mod = ctx.createOscillator();
  const modGain = ctx.createGain();
  const g = ctx.createGain();
  car.frequency.value = freq;
  mod.frequency.value = freq * 3.5;
  modGain.gain.setValueAtTime(freq * 2.2, t);
  modGain.gain.exponentialRampToValueAtTime(1, t + dur);
  mod.connect(modGain).connect(car.frequency);
  env(g, t, 0.005, vol, dur);
  car.connect(g).connect(out);
  car.start(t);
  mod.start(t);
  car.stop(t + dur + 0.05);
  mod.stop(t + dur + 0.05);
}

/** Медный аккорд: несколько расстроенных пил через фильтр с «вау» */
function brass(ctx: OfflineAudioContext, out: AudioNode, freqs: number[], t: number, dur: number, vol = 0.14) {
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 2;
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(3200, t + 0.08);
  f.frequency.exponentialRampToValueAtTime(1600, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
  g.gain.setValueAtTime(vol, t + dur - 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
  f.connect(g).connect(out);
  for (const fr of freqs) {
    for (const det of [-7, 0, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = fr;
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.3);
    }
  }
}

function drum(ctx: OfflineAudioContext, out: AudioNode, t: number, vol = 0.8) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
  env(g, t, 0.003, vol, 0.35);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.4);
}

function noiseHit(ctx: OfflineAudioContext, out: AudioNode, t: number, freq: number, q: number, dur: number, vol: number) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur + 0.05);
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, 0.002, vol, dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}

const note = (semi: number) => 440 * Math.pow(2, (semi - 9) / 12); // 0 = C4

const RENDERERS: Record<SoundId, [number, Render]> = {
  click: [
    0.15,
    (ctx, out) => {
      noiseHit(ctx, out, 0, 1800, 4, 0.05, 0.9);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(520, 0);
      o.frequency.exponentialRampToValueAtTime(260, 0.06);
      env(g, 0, 0.002, 0.35, 0.08);
      o.connect(g).connect(out);
      o.start(0);
      o.stop(0.12);
    },
  ],
  hover: [0.06, (ctx, out) => noiseHit(ctx, out, 0, 3500, 6, 0.03, 0.12)],
  add: [
    0.35,
    (ctx, out) => {
      bell(ctx, out, note(12 + 7), 0, 0.25, 0.2);
      bell(ctx, out, note(24), 0.07, 0.3, 0.2);
    },
  ],
  remove: [
    0.3,
    (ctx, out) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(500, 0);
      o.frequency.exponentialRampToValueAtTime(140, 0.2);
      env(g, 0, 0.005, 0.35, 0.22);
      o.connect(g).connect(out);
      o.start(0);
      o.stop(0.3);
    },
  ],
  open: [
    0.7,
    (ctx, out) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 0.7);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 3;
      f.frequency.setValueAtTime(300, 0);
      f.frequency.exponentialRampToValueAtTime(5000, 0.35);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, 0);
      g.gain.exponentialRampToValueAtTime(0.7, 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, 0.6);
      src.connect(f).connect(g).connect(out);
      src.start(0);
      bell(ctx, out, note(24 + 4), 0.3, 0.4, 0.12);
    },
  ],
  reveal: [
    1.2,
    (ctx, out) => {
      const r = withReverb(ctx, out, 0.35);
      [0, 4, 7, 12].forEach((s, i) => bell(ctx, r, note(12 + s), i * 0.045, 0.9, 0.16));
    },
  ],
  correct: [
    1.8,
    (ctx, out) => {
      const r = withReverb(ctx, out, 0.35);
      [0, 4, 7, 12, 16].forEach((s, i) => bell(ctx, r, note(12 + s), i * 0.08, 1.1, 0.26));
      brass(ctx, r, [note(12), note(16), note(19)], 0.42, 0.6, 0.08);
    },
  ],
  wrong: [
    1.2,
    (ctx, out) => {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 900;
      f.connect(out);
      [0, 0.28].forEach((t, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(i ? 147 : 175, t);
        o.frequency.linearRampToValueAtTime(i ? 98 : 165, t + (i ? 0.7 : 0.22));
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
        g.gain.setValueAtTime(0.35, t + (i ? 0.55 : 0.18));
        g.gain.exponentialRampToValueAtTime(0.0001, t + (i ? 0.85 : 0.26));
        o.connect(g).connect(f);
        o.start(t);
        o.stop(t + 0.9);
      });
    },
  ],
  tick: [
    0.12,
    (ctx, out) => {
      noiseHit(ctx, out, 0, 4200, 12, 0.03, 0.8);
      bell(ctx, out, 1760, 0, 0.06, 0.08);
    },
  ],
  timeUp: [
    3,
    (ctx, out) => {
      const r = withReverb(ctx, out, 0.5, 2.5);
      // Гонг: сумма негармоничных частичных с медленным затуханием
      [1, 1.47, 2.09, 2.56, 3.21, 4.1].forEach((m, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 98 * m;
        env(g, 0, 0.01, 0.22 / (i + 1), 2.6);
        o.connect(g).connect(r);
        o.start(0);
        o.stop(2.8);
      });
      noiseHit(ctx, r, 0, 600, 1, 0.3, 0.3);
    },
  ],
  catInBag: [
    1.6,
    (ctx, out) => {
      const r = withReverb(ctx, out, 0.25);
      // «Мяу»: пила через два формантных фильтра с глиссандо
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(520, 0);
      o.frequency.linearRampToValueAtTime(760, 0.22);
      o.frequency.linearRampToValueAtTime(430, 0.7);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, 0);
      g.gain.exponentialRampToValueAtTime(0.4, 0.06);
      g.gain.setValueAtTime(0.4, 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, 0.75);
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.Q.value = 6;
      f1.frequency.setValueAtTime(700, 0);
      f1.frequency.linearRampToValueAtTime(1200, 0.25);
      f1.frequency.linearRampToValueAtTime(800, 0.7);
      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.Q.value = 8;
      f2.frequency.setValueAtTime(2000, 0);
      f2.frequency.linearRampToValueAtTime(2600, 0.3);
      o.connect(g);
      g.connect(f1).connect(r);
      g.connect(f2).connect(r);
      o.start(0);
      o.stop(0.8);
      [7, 12, 16, 19].forEach((s, i) => bell(ctx, r, note(12 + s), 0.75 + i * 0.07, 0.6, 0.14));
    },
  ],
  auction: [
    1,
    (ctx, out) => {
      const r = withReverb(ctx, out, 0.25);
      [0, 0.18, 0.36].forEach((t, i) => {
        noiseHit(ctx, r, t, 900, 3, 0.08, 0.9);
        drum(ctx, r, t, i === 2 ? 0.9 : 0.5);
      });
    },
  ],
  fanfare: [
    4.2,
    (ctx, out) => {
      const r = withReverb(ctx, out, 0.4, 2.2);
      const seq: [number, number, number[]][] = [
        [0, 0.16, [7]],
        [0.18, 0.16, [7]],
        [0.36, 0.16, [7]],
        [0.54, 0.7, [0, 4, 7]],
        [1.3, 0.35, [5, 9, 12]],
        [1.7, 0.35, [7, 11, 14]],
        [2.1, 1.4, [12, 16, 19, 24]],
      ];
      for (const [t, d, notes] of seq) brass(ctx, r, notes.map((n) => note(n)), t, d, 0.07);
      [0.54, 1.3, 1.7, 2.1].forEach((t) => drum(ctx, r, t, 0.7));
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => bell(ctx, r, note(24 + s), 2.1 + i * 0.06, 1.2, 0.1));
    },
  ],
};

function encodeWav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels;
  const len = buf.length;
  const data = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const w = (o: number, s: string) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  data.setUint32(4, 36 + len * ch * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true);
  data.setUint16(22, ch, true);
  data.setUint32(24, buf.sampleRate, true);
  data.setUint32(28, buf.sampleRate * ch * 2, true);
  data.setUint16(32, ch * 2, true);
  data.setUint16(34, 16, true);
  w(36, 'data');
  data.setUint32(40, len * ch * 2, true);
  const chans = Array.from({ length: ch }, (_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      data.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([data], { type: 'audio/wav' });
}

export async function renderSound(id: SoundId): Promise<string> {
  const [seconds, render] = RENDERERS[id];
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * SR), SR);
  // Мягкий лимитер на выходе, чтобы ничего не клиппило
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.ratio.value = 6;
  comp.connect(ctx.destination);
  render(ctx, comp);
  const buf = await ctx.startRendering();
  return URL.createObjectURL(encodeWav(buf));
}

export const ALL_SOUNDS = Object.keys(RENDERERS) as SoundId[];
