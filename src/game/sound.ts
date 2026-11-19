import type { PourSoundId } from './types';

export interface PourSoundMeta {
  id: PourSoundId;
  title: string;
  tagline: string;
  badge: string;
  file: string;
}

export const POUR_SOUND_OPTIONS: PourSoundMeta[] = [
  {
    id: 'pour_glug_silk',
    title: 'Silk Glug',
    tagline: 'Soft splash roll-off and unhurried glass pour',
    badge: 'Soft Flow',
    file: '/assets/sounds/pour_glug_silk.mp3',
  },
  {
    id: 'pour_glug_velvet',
    title: 'Velvet ASMR',
    tagline: 'Warm deep mid-body with slow meditative glug',
    badge: 'Deep Warm',
    file: '/assets/sounds/pour_glug_velvet.mp3',
  },
  {
    id: 'pour_glug_oak',
    title: 'Oak Hollow',
    tagline: 'Tamed highs with gentle wooden alcove resonance',
    badge: 'Wood Alcove',
    file: '/assets/sounds/pour_glug_oak.mp3',
  },
  {
    id: 'pour_glug_dew',
    title: 'Quiet Dew',
    tagline: 'Whisper-soft peaks for calm late-night play',
    badge: 'Late-Night',
    file: '/assets/sounds/pour_glug_dew.mp3',
  },
  {
    id: 'pour_glug',
    title: 'Bottle Glug',
    tagline: 'Unfiltered original pour for direct comparison',
    badge: 'Baseline',
    file: '/assets/sounds/pour_glug.mp3',
  },
];

export function getPourSoundMeta(id: PourSoundId): PourSoundMeta {
  return POUR_SOUND_OPTIONS.find((item) => item.id === id) ?? POUR_SOUND_OPTIONS[0];
}

let audioCtx: AudioContext | null = null;
const bufferCache = new Map<PourSoundId, AudioBuffer>();
const pendingBuffers = new Map<PourSoundId, Promise<AudioBuffer | null>>();
let activePreviewCleanup: (() => void) | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

async function loadPourBuffer(ctx: AudioContext, id: PourSoundId): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(id);
  if (cached) return cached;
  const inflight = pendingBuffers.get(id);
  if (inflight) return inflight;

  const meta = getPourSoundMeta(id);
  const promise = (async () => {
    try {
      const res = await fetch(meta.file);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arr);
      bufferCache.set(id, decoded);
      return decoded;
    } catch {
      return null;
    } finally {
      pendingBuffers.delete(id);
    }
  })();

  pendingBuffers.set(id, promise);
  return promise;
}

export function preloadPourSounds(): void {
  const ctx = ensureCtx();
  if (!ctx) return;
  for (const opt of POUR_SOUND_OPTIONS) {
    void loadPourBuffer(ctx, opt.id);
  }
}

export function triggerHaptic(enabled: boolean, durationMs = 10): void {
  if (!enabled || typeof navigator === 'undefined') return;
  try {
    navigator.vibrate?.(durationMs);
  } catch {
    // Ignore unsupported platforms
  }
}

export function playPickupClink(enabled: boolean): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  // Warm up pour audio buffers on first bottle interaction
  preloadPourSounds();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(660, now + 0.065);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.045, now + 0.016);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.17);
}

export function playErrorTap(enabled: boolean): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(108, now + 0.1);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.035, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.13);
}

function playFallbackElement(file: string, volume: number, playbackRate: number, maxMs?: number, onDone?: () => void): () => void {
  if (typeof Audio === 'undefined') {
    onDone?.();
    return () => {};
  }
  const el = new Audio(file);
  el.volume = Math.max(0, Math.min(1, volume));
  el.playbackRate = playbackRate;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const cleanup = () => {
    if (stopped) return;
    stopped = true;
    if (timer) clearTimeout(timer);
    el.pause();
    el.src = '';
    onDone?.();
  };

  el.addEventListener('ended', cleanup, { once: true });
  el.play().catch(cleanup);

  if (maxMs) {
    timer = setTimeout(cleanup, maxMs);
  }
  return cleanup;
}

export function playPourSound(
  enabled: boolean,
  layerCount: number,
  pourSound: PourSoundId = 'pour_glug_silk'
): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  const drops = Math.max(1, Math.min(4, layerCount));
  const rate = drops === 1 ? 0.98 : drops === 2 ? 0.9 : 0.84;
  const playDur = Math.min(1.02, 0.56 + drops * 0.14);

  if (!ctx) {
    const meta = getPourSoundMeta(pourSound);
    setTimeout(() => {
      playFallbackElement(meta.file, 0.55, rate, Math.round(playDur * 1000));
    }, 60);
    return;
  }

  const cached = bufferCache.get(pourSound);
  if (cached) {
    const startAt = ctx.currentTime + 0.065;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = cached;
    src.playbackRate.setValueAtTime(rate, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(0.58, startAt + 0.045);
    gain.gain.setValueAtTime(0.58, startAt + Math.max(0.08, playDur - 0.18));
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + playDur);

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(startAt);
    src.stop(startAt + playDur + 0.03);
    return;
  }

  // First pour before buffer finishes decoding: decode in background and use HTMLAudio immediately
  void loadPourBuffer(ctx, pourSound);
  const meta = getPourSoundMeta(pourSound);
  setTimeout(() => {
    playFallbackElement(meta.file, 0.55, rate, Math.round(playDur * 1000));
  }, 60);
}

export function previewPourSound(pourSound: PourSoundId, onEnded?: () => void): void {
  activePreviewCleanup?.();
  activePreviewCleanup = null;

  const ctx = ensureCtx();
  const meta = getPourSoundMeta(pourSound);

  if (!ctx) {
    activePreviewCleanup = playFallbackElement(meta.file, 0.72, 1.0, undefined, onEnded);
    return;
  }

  const cached = bufferCache.get(pourSound);
  if (cached) {
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = cached;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.72, now + 0.04);
    gain.gain.setValueAtTime(0.72, now + Math.max(0.12, cached.duration - 0.16));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + cached.duration);
    src.connect(gain);
    gain.connect(ctx.destination);

    let done = false;
    const stop = () => {
      if (done) return;
      done = true;
      try {
        src.stop();
      } catch {
        // already stopped
      }
      onEnded?.();
    };
    src.onended = () => {
      if (activePreviewCleanup === stop) activePreviewCleanup = null;
      if (!done) {
        done = true;
        onEnded?.();
      }
    };
    activePreviewCleanup = stop;
    src.start(now);
    return;
  }

  void loadPourBuffer(ctx, pourSound);
  activePreviewCleanup = playFallbackElement(meta.file, 0.72, 1.0, undefined, () => {
    activePreviewCleanup = null;
    onEnded?.();
  });
}

export function playCorkPop(enabled: boolean): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(165, now);
  osc.frequency.exponentialRampToValueAtTime(360, now + 0.085);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.17);
}

export function playBottleComplete(enabled: boolean): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [293.66, 369.99, 440.0, 587.33].forEach((freq, idx) => {
    const t = now + idx * 0.078;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.022);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.46);
  });
}

export function playVictoryFanfare(enabled: boolean): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  [261.63, 329.63, 392.0, 493.88, 523.25].forEach((freq, idx) => {
    const t = now + idx * 0.105;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.028);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.56);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.58);
  });
}
