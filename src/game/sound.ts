import type { CgTier } from './types';

export const POUR_SOUND_FILE = '/assets/sounds/asmr_bottle_glug.mp3';

let audioCtx: AudioContext | null = null;
let cachedPourBuffer: AudioBuffer | null = null;
let pendingPourBuffer: Promise<AudioBuffer | null> | null = null;
let activePourCleanup: (() => void) | null = null;

// Procedural Sunlit Conservatory BGM state
let bgmMasterGain: GainNode | null = null;
let bgmTimer: ReturnType<typeof setInterval> | null = null;
let bgmStep = 0;
let bgmWanted = false;
let bgmDuckTimer: ReturnType<typeof setTimeout> | null = null;

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

// Gentle C-major / F-lydian sunlit harp + warm marimba arpeggio cycle (16 steps @ 520ms)
const BGM_HARP_NOTES: Array<number | null> = [
  523.25, 659.25, 783.99, 987.77,
  659.25, 783.99, 1046.5, null,
  440.0, 523.25, 659.25, 783.99,
  587.33, 659.25, 783.99, null,
];
const BGM_BASS_NOTES: Array<number | null> = [
  130.81, null, null, null,
  174.61, null, null, null,
  110.0, null, null, null,
  146.83, null, 196.0, null,
];

function scheduleBgmStep(): void {
  if (!bgmWanted || !audioCtx || !bgmMasterGain) return;
  if (audioCtx.state !== 'running') return;
  if (typeof document !== 'undefined' && document.hidden) return;

  const now = audioCtx.currentTime;
  const idx = bgmStep % BGM_HARP_NOTES.length;
  bgmStep += 1;

  const harpFreq = BGM_HARP_NOTES[idx];
  if (harpFreq) {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(harpFreq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.035);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
    osc.connect(g);
    g.connect(bgmMasterGain);
    osc.start(now);
    osc.stop(now + 1.1);
  }

  const bassFreq = BGM_BASS_NOTES[idx];
  if (bassFreq) {
    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(bassFreq, now);
    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.linearRampToValueAtTime(0.24, now + 0.08);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.85);
    bassOsc.connect(bassGain);
    bassGain.connect(bgmMasterGain);
    bassOsc.start(now);
    bassOsc.stop(now + 1.9);
  }

  // Delicate sparkle chime every 8 steps
  if (idx === 6 || idx === 14) {
    const chime = audioCtx.createOscillator();
    const cg = audioCtx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(idx === 6 ? 1318.5 : 1567.98, now + 0.14);
    cg.gain.setValueAtTime(0.0001, now + 0.14);
    cg.gain.linearRampToValueAtTime(0.06, now + 0.17);
    cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    chime.connect(cg);
    cg.connect(bgmMasterGain);
    chime.start(now + 0.14);
    chime.stop(now + 0.98);
  }
}

export function startBgm(enabled: boolean): void {
  bgmWanted = enabled;
  if (!enabled) {
    stopBgm();
    return;
  }
  const ctx = ensureCtx();
  if (!ctx) return;

  if (!bgmMasterGain) {
    bgmMasterGain = ctx.createGain();
    bgmMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    bgmMasterGain.connect(ctx.destination);
  }

  const now = ctx.currentTime;
  bgmMasterGain.gain.cancelScheduledValues(now);
  bgmMasterGain.gain.setValueAtTime(Math.max(0.0001, bgmMasterGain.gain.value), now);
  bgmMasterGain.gain.linearRampToValueAtTime(0.11, now + 0.65);

  if (!bgmTimer) {
    scheduleBgmStep();
    bgmTimer = setInterval(scheduleBgmStep, 520);
  }
}

export function stopBgm(): void {
  bgmWanted = false;
  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
  if (bgmDuckTimer) {
    clearTimeout(bgmDuckTimer);
    bgmDuckTimer = null;
  }
  if (audioCtx && bgmMasterGain) {
    const now = audioCtx.currentTime;
    bgmMasterGain.gain.cancelScheduledValues(now);
    bgmMasterGain.gain.setValueAtTime(Math.max(0.0001, bgmMasterGain.gain.value), now);
    bgmMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  }
}

export function duckBgm(durationMs = 700): void {
  if (!bgmWanted || !audioCtx || !bgmMasterGain) return;
  const now = audioCtx.currentTime;
  bgmMasterGain.gain.cancelScheduledValues(now);
  bgmMasterGain.gain.setValueAtTime(Math.max(0.0001, bgmMasterGain.gain.value), now);
  bgmMasterGain.gain.linearRampToValueAtTime(0.038, now + 0.08);
  if (bgmDuckTimer) clearTimeout(bgmDuckTimer);
  bgmDuckTimer = setTimeout(() => {
    bgmDuckTimer = null;
    if (!bgmWanted || !audioCtx || !bgmMasterGain) return;
    const t = audioCtx.currentTime;
    bgmMasterGain.gain.cancelScheduledValues(t);
    bgmMasterGain.gain.setValueAtTime(Math.max(0.0001, bgmMasterGain.gain.value), t);
    bgmMasterGain.gain.linearRampToValueAtTime(0.11, t + 0.45);
  }, durationMs);
}

export function handleVisibilityAudioSync(bgmEnabled: boolean): void {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    if (audioCtx && audioCtx.state === 'running') {
      audioCtx.suspend().catch(() => {});
    }
  } else {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    if (bgmEnabled) {
      startBgm(true);
    }
  }
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

export function playUiClick(enabled: boolean): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(640, now);
  osc.frequency.exponentialRampToValueAtTime(860, now + 0.042);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.036, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

export function playPickupClink(enabled: boolean): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
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

  duckBgm(640);

  const ctx = ensureCtx();
  const drops = Math.max(1, Math.min(4, layerCount));
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
  osc.frequency.exponentialRampToValueAtTime(380, now + 0.085);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.065, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.17);
}

export function playObstacleUnlockSound(
  enabled: boolean,
  type: 'cork' | 'crate' | 'curtain'
): void {
  if (!enabled) return;
  if (type === 'cork') {
    playCorkPop(true);
    return;
  }
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (type === 'crate') {
    // Crisp woody crack + sparkling padlock chime
    [220, 330, 587.33, 880].forEach((freq, idx) => {
      const t = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = idx < 2 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t + 0.12);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(idx < 2 ? 0.032 : 0.045, t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  } else {
    // Silky ascending harp whoosh for velvet curtain lift
    [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
      const t = now + idx * 0.045;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.035, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }
}

export function playSealRiseChime(enabled: boolean, comboStep = 0): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  duckBgm(950);
  const now = ctx.currentTime;
  const pitchMult = Math.pow(1.06, Math.min(5, Math.max(0, comboStep)));
  [523.25, 659.25, 783.99, 1046.5].forEach((baseFreq, idx) => {
    const freq = baseFreq * pitchMult;
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

export function playBottleComplete(enabled: boolean, comboStep = 0): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const pitchMult = Math.pow(1.06, Math.min(5, Math.max(0, comboStep)));
  [293.66, 369.99, 440.0, 587.33].forEach((baseFreq, idx) => {
    const freq = baseFreq * pitchMult;
    const t = now + idx * 0.075;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.048, t + 0.022);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.44);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.46);
  });
}

export function playCoinTick(enabled: boolean, index = 0): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const freq = 980 + Math.min(7, index) * 75;
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.06);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.032, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

export function playVictoryFanfare(enabled: boolean, tier: CgTier = 1): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  duckBgm(1400);
  const now = ctx.currentTime;
  const notes =
    tier === 3
      ? [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5]
      : tier === 2
      ? [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]
      : [261.63, 329.63, 392.0, 493.88, 523.25];
  notes.forEach((freq, idx) => {
    const t = now + idx * (tier === 3 ? 0.085 : 0.102);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tier >= 2 && idx >= notes.length - 2 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(tier === 3 ? 0.058 : 0.05, t + 0.026);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (idx === notes.length - 1 ? 0.8 : 0.52));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.84);
  });
}

export function playDefeatChime(enabled: boolean, tier: CgTier = 1): void {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  duckBgm(900);
  const now = ctx.currentTime;
  // Playful descending cartoon-warm sigh -> encouraging resolve note on Tier 3
  const notes =
    tier === 3
      ? [349.23, 311.13, 261.63, 329.63]
      : tier === 2
      ? [392.0, 349.23, 293.66, 261.63]
      : [392.0, 349.23, 329.63];
  notes.forEach((freq, idx) => {
    const t = now + idx * 0.115;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.042, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);
  });
}
