export const POUR_SOUND_FILE = '/assets/sounds/asmr_bottle_glug.mp3';

let audioCtx: AudioContext | null = null;
let cachedPourBuffer: AudioBuffer | null = null;
let pendingPourBuffer: Promise<AudioBuffer | null> | null = null;
let activePourCleanup: (() => void) | null = null;

export function stopPourSound(): void {
  activePourCleanup?.();
  activePourCleanup = null;
}

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

async function loadPourBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (cachedPourBuffer) return cachedPourBuffer;
  if (pendingPourBuffer) return pendingPourBuffer;

  const promise = (async () => {
    try {
      const res = await fetch(POUR_SOUND_FILE);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arr);
      cachedPourBuffer = decoded;
      return decoded;
    } catch {
      return null;
    } finally {
      pendingPourBuffer = null;
    }
  })();

  pendingPourBuffer = promise;
  return promise;
}

export function preloadPourSounds(): void {
  const ctx = ensureCtx();
  if (!ctx) return;
  void loadPourBuffer(ctx);
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
  // Warm up pour audio buffer on first bottle interaction
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

function playFallbackElement(
  file: string,
  volume: number,
  playbackRate: number,
  maxMs?: number,
  onDone?: () => void
): () => void {
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

export function playPourSound(enabled: boolean, layerCount: number): void {
  stopPourSound();
  if (!enabled) return;

  const ctx = ensureCtx();
  const drops = Math.max(1, Math.min(4, layerCount));
  // Strictly synced to active liquid stream window inside POUR_DURATION_MS (680ms):
  // starts at 0.14s when stream enters the bottle and finishes cleanly at ~0.58s
  // before the bottle lands back on the shelf.
  const rate = drops === 1 ? 1.02 : drops === 2 ? 0.99 : 0.96;
  const startDelaySec = 0.14;
  const streamDurSec = 0.44;

  if (!ctx) {
    let innerStop: (() => void) | null = null;
    const timer = setTimeout(() => {
      innerStop = playFallbackElement(POUR_SOUND_FILE, 0.68, rate, Math.round(streamDurSec * 1000));
    }, Math.round(startDelaySec * 1000));
    activePourCleanup = () => {
      clearTimeout(timer);
      innerStop?.();
    };
    return;
  }

  if (cachedPourBuffer) {
    const playDur = Math.min(cachedPourBuffer.duration / rate, streamDurSec);
    const startAt = ctx.currentTime + startDelaySec;
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = cachedPourBuffer;
    src.playbackRate.setValueAtTime(rate, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(0.7, startAt + 0.035);
    gain.gain.setValueAtTime(0.7, startAt + Math.max(0.08, playDur - 0.11));
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + playDur);

    src.connect(gain);
    gain.connect(ctx.destination);

    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      try {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        src.stop(now + 0.035);
      } catch {
        // already stopped
      }
    };
    src.onended = () => {
      stopped = true;
      if (activePourCleanup === stop) activePourCleanup = null;
    };
    activePourCleanup = stop;
    src.start(startAt);
    src.stop(startAt + playDur + 0.02);
    return;
  }

  // First pour before buffer finishes decoding: decode in background and use HTMLAudio immediately
  void loadPourBuffer(ctx);
  let innerStop: (() => void) | null = null;
  const timer = setTimeout(() => {
    innerStop = playFallbackElement(POUR_SOUND_FILE, 0.68, rate, Math.round(streamDurSec * 1000));
  }, Math.round(startDelaySec * 1000));
  activePourCleanup = () => {
    clearTimeout(timer);
    innerStop?.();
  };
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

export function playSealRiseChime(enabled: boolean): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  // Airy ascending crystalline shimmer synced with the double-helix ribbons rising (0.0s -> 0.55s)
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
    const t = now + idx * 0.115;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 0.24);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.028, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);
  });
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
