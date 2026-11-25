import type { CgTier, DifficultyTier } from './types';

export const POUR_SOUND_FILE = '/assets/sounds/asmr_bottle_glug.mp3';

export type BgmMood = 'home' | 'flow' | 'challenge' | 'climax';
export type UiClickVariant = 'primary' | 'tab' | 'close';

// Pentatonic combo escalation ratios (C -> D -> E -> G -> A -> C' -> D')
// Avoids jarring chromatic clashes against the F-Lydian / C-Pentatonic BGM
const PENTATONIC_RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4] as const;

export function getPentatonicComboMultiplier(comboStep: number): number {
  const clamped = Math.max(0, Math.min(PENTATONIC_RATIOS.length - 1, Math.floor(comboStep)));
  return PENTATONIC_RATIOS[clamped];
}

export function resolveGameplayBgmMood(params: {
  inGameplay: boolean;
  difficulty?: DifficultyTier;
  isTrial?: boolean;
  streak?: number;
  remainingBottles?: number;
}): BgmMood {
  if (!params.inGameplay) return 'home';
  const remaining = params.remainingBottles ?? 99;
  const streak = params.streak ?? 0;
  if (remaining > 0 && remaining <= 2) return 'climax';
  if (streak >= 3) return 'climax';
  if (params.isTrial || params.difficulty === 'hard' || params.difficulty === 'super_hard') {
    return 'challenge';
  }
  return 'flow';
}

// ============================================================================
// Master Mixer Graph, Conservatory Reverb & Polyphony Guard
// ============================================================================

interface AudioGraph {
  ctx: AudioContext;
  masterGain: GainNode;
  compressor: DynamicsCompressorNode;
  bgmBus: GainNode;
  bgmDuckGain: GainNode;
  bgmFilter: BiquadFilterNode;
  sfxBus: GainNode;
  reverbSend: GainNode;
  reverbReturn: GainNode;
  noiseBuffer: AudioBuffer;
  // Adaptive BGM stem gains
  stemHarp: GainNode;
  stemMelody: GainNode;
  stemPad: GainNode;
  stemBass: GainNode;
  stemPerc: GainNode;
  stemCelesta: GainNode;
}

let graph: AudioGraph | null = null;
let cachedPourBuffer: AudioBuffer | null = null;
let pendingPourBuffer: Promise<AudioBuffer | null> | null = null;
let activePourCleanup: (() => void) | null = null;

// Voice polyphony limiter (protects low-end Android WebViews from crackling)
const MAX_ACTIVE_VOICES = 28;
let activeVoices = 0;

function acquireVoice(durationSec: number): boolean {
  if (activeVoices >= MAX_ACTIVE_VOICES) return false;
  activeVoices += 1;
  const releaseMs = Math.max(60, Math.ceil(durationSec * 1000) + 40);
  setTimeout(() => {
    activeVoices = Math.max(0, activeVoices - 1);
  }, releaseMs);
  return true;
}

function createNoiseBuffer(ctx: AudioContext, seconds = 1.5): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buf;
}

/**
 * Procedurally synthesizes a warm 1.15s sunlit wooden-and-glass conservatory
 * stereo impulse response with multi-tap early reflections and gentle high-end rolloff.
 */
function createConservatoryImpulse(ctx: AudioContext): AudioBuffer {
  const duration = 1.15;
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * duration);
  const impulse = ctx.createBuffer(2, len, sr);
  const earlyTaps = [0.011, 0.019, 0.029, 0.043, 0.061];

  for (let ch = 0; ch < 2; ch++) {
    const out = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const white = Math.random() * 2 - 1;
      // Gentle one-pole lowpass so the room sounds woody & warm instead of metallic
      lp = lp * 0.72 + white * 0.28;
      const decay = Math.pow(1 - t / duration, 2.65);
      out[i] = lp * decay * 0.42;
    }
    // Add subtle stereo early reflections
    earlyTaps.forEach((tapSec, idx) => {
      const offset = Math.floor((tapSec + ch * 0.0023) * sr);
      if (offset < len) {
        out[offset] += (idx % 2 === 0 ? 1 : -1) * (0.32 / (idx + 1));
      }
    });
  }
  return impulse;
}

function ensureGraph(): AudioGraph | null {
  if (typeof window === 'undefined') return null;
  if (!graph) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;

    const ctx = new Ctx();

    // Master chain: masterGain -> soft limiter compressor -> destination
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.92, ctx.currentTime);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, ctx.currentTime);
    compressor.knee.setValueAtTime(18, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);
    compressor.attack.setValueAtTime(0.005, ctx.currentTime);
    compressor.release.setValueAtTime(0.18, ctx.currentTime);

    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    // Procedural conservatory convolution reverb bus
    const reverbSend = ctx.createGain();
    reverbSend.gain.setValueAtTime(0.55, ctx.currentTime);

    const convolver = ctx.createConvolver();
    convolver.buffer = createConservatoryImpulse(ctx);

    const reverbWarmFilter = ctx.createBiquadFilter();
    reverbWarmFilter.type = 'lowpass';
    reverbWarmFilter.frequency.setValueAtTime(3200, ctx.currentTime);

    const reverbReturn = ctx.createGain();
    reverbReturn.gain.setValueAtTime(0.36, ctx.currentTime);

    reverbSend.connect(convolver);
    convolver.connect(reverbWarmFilter);
    reverbWarmFilter.connect(reverbReturn);
    reverbReturn.connect(masterGain);

    // BGM bus: stems -> bgmFilter (warm carve) -> bgmDuckGain -> bgmBus -> master + light reverb
    const bgmFilter = ctx.createBiquadFilter();
    bgmFilter.type = 'lowpass';
    bgmFilter.frequency.setValueAtTime(4400, ctx.currentTime);

    const bgmDuckGain = ctx.createGain();
    bgmDuckGain.gain.setValueAtTime(1.0, ctx.currentTime);

    const bgmBus = ctx.createGain();
    bgmBus.gain.setValueAtTime(0.0001, ctx.currentTime);

    const bgmReverbTap = ctx.createGain();
    bgmReverbTap.gain.setValueAtTime(0.32, ctx.currentTime);

    bgmFilter.connect(bgmDuckGain);
    bgmDuckGain.connect(bgmBus);
    bgmBus.connect(masterGain);
    bgmBus.connect(bgmReverbTap);
    bgmReverbTap.connect(reverbSend);

    // Individual BGM adaptive stems
    const makeStem = (initial: number) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(initial, ctx.currentTime);
      g.connect(bgmFilter);
      return g;
    };

    const stemHarp = makeStem(1.0);
    const stemMelody = makeStem(0.9);
    const stemPad = makeStem(0.75);
    const stemBass = makeStem(0.85);
    const stemPerc = makeStem(0.0001);
    const stemCelesta = makeStem(0.0001);

    // SFX bus -> masterGain
    const sfxBus = ctx.createGain();
    sfxBus.gain.setValueAtTime(0.95, ctx.currentTime);
    sfxBus.connect(masterGain);

    graph = {
      ctx,
      masterGain,
      compressor,
      bgmBus,
      bgmDuckGain,
      bgmFilter,
      sfxBus,
      reverbSend,
      reverbReturn,
      noiseBuffer: createNoiseBuffer(ctx, 1.5),
      stemHarp,
      stemMelody,
      stemPad,
      stemBass,
      stemPerc,
      stemCelesta,
    };
  }

  if (graph.ctx.state === 'suspended') {
    graph.ctx.resume().catch(() => {});
  }
  return graph;
}

function connectWithPanAndReverb(
  g: AudioGraph,
  node: AudioNode,
  dest: AudioNode,
  pan = 0,
  reverbWet = 0.2
): void {
  let outNode: AudioNode = node;
  if (typeof g.ctx.createStereoPanner === 'function' && Math.abs(pan) > 0.01) {
    const panner = g.ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-0.8, Math.min(0.8, pan)), g.ctx.currentTime);
    node.connect(panner);
    outNode = panner;
  }
  outNode.connect(dest);
  if (reverbWet > 0.01) {
    const wet = g.ctx.createGain();
    wet.gain.setValueAtTime(reverbWet, g.ctx.currentTime);
    outNode.connect(wet);
    wet.connect(g.reverbSend);
  }
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ============================================================================
// Acoustic Workshop Instrument Bank (6 Signature Timbres)
// ============================================================================

/** 1. Sunlit Harp — Warm plucked string with bright opening filter sweep */
function playHarpNote(
  g: AudioGraph,
  dest: AudioNode,
  freq: number,
  startAt: number,
  vol = 0.16,
  dur = 1.45,
  pan = 0,
  wet = 0.34
): void {
  if (!acquireVoice(dur)) return;
  const { ctx } = g;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(7200, freq * 5.2), startAt);
  filter.frequency.exponentialRampToValueAtTime(Math.max(520, freq * 1.65), startAt + dur * 0.65);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.linearRampToValueAtTime(vol, startAt + 0.012);
  env.gain.exponentialRampToValueAtTime(vol * 0.32, startAt + dur * 0.35);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  // Fundamental (triangle) + warm 2nd harmonic (sine)
  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, startAt);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, startAt);
  const h2Gain = ctx.createGain();
  h2Gain.gain.setValueAtTime(0.28, startAt);

  osc1.connect(filter);
  osc2.connect(h2Gain);
  h2Gain.connect(filter);
  filter.connect(env);
  connectWithPanAndReverb(g, env, dest, pan, wet);

  osc1.start(startAt);
  osc2.start(startAt);
  osc1.stop(startAt + dur + 0.04);
  osc2.stop(startAt + dur + 0.04);
}

/** 2. Warm Marimba — Woody fundamental + stretched 3.98x mallet overtone */
function playMarimbaNote(
  g: AudioGraph,
  dest: AudioNode,
  freq: number,
  startAt: number,
  vol = 0.16,
  dur = 0.48,
  pan = 0,
  wet = 0.22
): void {
  if (!acquireVoice(dur)) return;
  const { ctx } = g;

  const body = ctx.createOscillator();
  body.type = 'sine';
  body.frequency.setValueAtTime(freq, startAt);

  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.0001, startAt);
  bodyGain.gain.linearRampToValueAtTime(vol, startAt + 0.008);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  // Classic marimba ~3.98x stretched woody harmonic (decays quickly)
  const over = ctx.createOscillator();
  over.type = 'sine';
  over.frequency.setValueAtTime(freq * 3.98, startAt);
  const overGain = ctx.createGain();
  overGain.gain.setValueAtTime(0.0001, startAt);
  overGain.gain.linearRampToValueAtTime(vol * 0.26, startAt + 0.004);
  overGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.065);

  const mix = ctx.createGain();
  body.connect(bodyGain);
  bodyGain.connect(mix);
  over.connect(overGain);
  overGain.connect(mix);

  connectWithPanAndReverb(g, mix, dest, pan, wet);

  body.start(startAt);
  over.start(startAt);
  body.stop(startAt + dur + 0.03);
  over.stop(startAt + 0.09);
}

/** 3. Crystal Celesta / Music Box — Sparkling glassy metallic bell partials */
function playCelestaNote(
  g: AudioGraph,
  dest: AudioNode,
  freq: number,
  startAt: number,
  vol = 0.09,
  dur = 1.25,
  pan = 0,
  wet = 0.45
): void {
  if (!acquireVoice(dur)) return;
  const { ctx } = g;

  const mix = ctx.createGain();
  const partials: Array<[number, number, number]> = [
    [1.0, 1.0, dur],
    [2.0, 0.34, dur * 0.72],
    [3.02, 0.16, dur * 0.42],
    [4.18, 0.08, dur * 0.22],
  ];

  partials.forEach(([ratio, amp, pDur]) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * ratio, startAt);
    env.gain.setValueAtTime(0.0001, startAt);
    env.gain.linearRampToValueAtTime(vol * amp, startAt + 0.007);
    env.gain.exponentialRampToValueAtTime(0.0001, startAt + pDur);
    osc.connect(env);
    env.connect(mix);
    osc.start(startAt);
    osc.stop(startAt + pDur + 0.03);
  });

  connectWithPanAndReverb(g, mix, dest, pan, wet);
}

/** 4. Pizzicato String Bass — Warm plucked cello/bass foundation */
function playPizzBassNote(
  g: AudioGraph,
  dest: AudioNode,
  freq: number,
  startAt: number,
  vol = 0.22,
  dur = 0.75
): void {
  if (!acquireVoice(dur)) return;
  const { ctx } = g;

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, startAt);

  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(freq, startAt);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 4.5, startAt);
  filter.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 1.3), startAt + 0.22);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.linearRampToValueAtTime(vol, startAt + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  osc.connect(filter);
  sub.connect(filter);
  filter.connect(env);
  env.connect(dest);

  osc.start(startAt);
  sub.start(startAt);
  osc.stop(startAt + dur + 0.04);
  sub.stop(startAt + dur + 0.04);
}

/** 5. Conservatory Warm Pad — Silky detuned string swell */
function playWarmPadChord(
  g: AudioGraph,
  dest: AudioNode,
  freqs: number[],
  startAt: number,
  vol = 0.055,
  dur = 2.6
): void {
  if (!acquireVoice(dur)) return;
  const { ctx } = g;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1050, startAt);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.linearRampToValueAtTime(vol, startAt + dur * 0.28);
  env.gain.setValueAtTime(vol * 0.88, startAt + dur * 0.65);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    osc.type = idx === 0 ? 'sine' : 'triangle';
    // Subtle detune for lush acoustic warmth
    osc.frequency.setValueAtTime(f * (1 + (idx % 2 === 0 ? 0.0022 : -0.0022)), startAt);
    osc.connect(filter);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.05);
  });

  filter.connect(env);
  connectWithPanAndReverb(g, env, dest, 0, 0.35);
}

/** 6. Playful Bassoon / Cartoon Woodwind — Expressive reedy tone for comedic moments */
function playBassoonNote(
  g: AudioGraph,
  dest: AudioNode,
  startFreq: number,
  endFreq: number,
  startAt: number,
  vol = 0.14,
  dur = 0.36
): void {
  if (!acquireVoice(dur)) return;
  const { ctx } = g;

  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.setValueAtTime(startFreq, startAt);
  if (Math.abs(endFreq - startFreq) > 0.5) {
    saw.frequency.exponentialRampToValueAtTime(endFreq, startAt + dur * 0.85);
  }

  const tri = ctx.createOscillator();
  tri.type = 'triangle';
  tri.frequency.setValueAtTime(startFreq * 0.5, startAt);
  if (Math.abs(endFreq - startFreq) > 0.5) {
    tri.frequency.exponentialRampToValueAtTime(endFreq * 0.5, startAt + dur * 0.85);
  }

  // Reedy woody formant resonance
  const formant = ctx.createBiquadFilter();
  formant.type = 'bandpass';
  formant.frequency.setValueAtTime(Math.max(380, startFreq * 2.1), startAt);
  formant.Q.setValueAtTime(2.6, startAt);

  const bodyLp = ctx.createBiquadFilter();
  bodyLp.type = 'lowpass';
  bodyLp.frequency.setValueAtTime(1450, startAt);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.linearRampToValueAtTime(vol, startAt + 0.032);
  env.gain.setValueAtTime(vol * 0.82, startAt + dur * 0.55);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  saw.connect(formant);
  tri.connect(bodyLp);
  formant.connect(bodyLp);
  bodyLp.connect(env);
  connectWithPanAndReverb(g, env, dest, 0, 0.28);

  saw.start(startAt);
  tri.start(startAt);
  saw.stop(startAt + dur + 0.04);
  tri.stop(startAt + dur + 0.04);
}

/** Delicate wooden shaker / soft clave tick for Challenge BGM stem */
function playSoftShaker(g: AudioGraph, dest: AudioNode, startAt: number, accent = false): void {
  if (!acquireVoice(0.08)) return;
  const { ctx } = g;
  const src = ctx.createBufferSource();
  src.buffer = g.noiseBuffer;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(accent ? 4200 : 3200, startAt);
  bp.Q.setValueAtTime(3.2, startAt);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, startAt);
  env.gain.linearRampToValueAtTime(accent ? 0.045 : 0.025, startAt + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.055);

  src.connect(bp);
  bp.connect(env);
  env.connect(dest);
  src.start(startAt, randRange(0, 0.4), 0.07);
}

// ============================================================================
// 4-State Adaptive 64-Step Look-Ahead BGM Sequencer (F Lydian / C Pentatonic)
// ============================================================================
// 64 eighth-note steps @ 92 BPM (~326ms/step) => ~20.9s per A-B-A'-C cycle with
// alternate repeat voicings (total ~42s rich evolution before exact repeat).

const STEP_SEC = 0.326; // 92 BPM eighth-note pulse
const LOOKAHEAD_MS = 45;
const SCHEDULE_AHEAD_SEC = 0.14;

// Note frequencies helper (Hz)
const N = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98,
} as const;

// 64-step Harp arpeggio pattern (Phrases: A [0..15] Cmaj7-Fmaj7, B [16..31] Am7-G6, A' [32..47] Fmaj7-Em7, C [48..63] Dm7-G9sus4)
const HARP_SEQ: Array<number | null> = [
  // A: Sunlit Morning (C -> Fmaj7)
  N.C4, N.G4, N.E5, N.G4,  N.D5, N.G4, N.C5, null,
  N.F4, N.C5, N.A5, N.C5,  N.G5, N.E5, N.C5, null,
  // B: Floating Greenhouse (Am7 -> G6)
  N.A4, N.E5, N.C5, N.G5,  N.E5, N.C5, N.A4, null,
  N.G4, N.D5, N.B4, N.G5,  N.E5, N.D5, N.B4, null,
  // A': Golden Afternoon (Fmaj7 -> Em7)
  N.F4, N.A4, N.E5, N.C5,  N.G5, N.E5, N.A4, null,
  N.E4, N.B4, N.G5, N.D5,  N.E5, N.B4, N.G4, null,
  // C: Gentle Alchemy Resolve (Dm9 -> Gsus4)
  N.D4, N.A4, N.E5, N.F5,  N.E5, N.C5, N.A4, null,
  N.G4, N.C5, N.D5, N.G5,  N.E5, N.D5, N.C5, null,
];

// Singing Marimba Melody (prominent in Home, softly tucked in Flow)
const MELODY_SEQ: Array<number | null> = [
  // A
  N.E5, null, N.G5, null,  N.A5, null, N.G5, N.E5,
  N.C5, null, N.D5, N.E5,  N.G5, null, null, null,
  // B
  N.A5, null, N.G5, N.E5,  N.D5, null, N.C5, null,
  N.D5, null, N.E5, N.G5,  N.D5, null, null, null,
  // A'
  N.C5, null, N.E5, N.G5,  N.A5, null, N.C6, N.A5,
  N.G5, null, N.E5, null,  N.D5, null, null, null,
  // C
  N.E5, null, N.D5, N.C5,  N.A4, null, N.C5, N.D5,
  N.E5, null, N.G5, N.E5,  N.D5, null, N.C5, null,
];

// Pizzicato Bass foundation (extra syncopation activates on Challenge)
const BASS_SEQ: Array<number | null> = [
  N.C3, null, null, null,  N.G3, null, null, null,
  N.F3, null, null, null,  N.C3, null, null, null,
  N.A3, null, null, null,  N.E3, null, null, null,
  N.G3, null, null, null,  N.D3, null, N.G3, null,
  N.F3, null, null, null,  N.C3, null, null, null,
  N.E3, null, null, null,  N.B3, null, null, null,
  N.D3, null, null, null,  N.A3, null, null, null,
  N.G3, null, null, null,  N.D3, null, N.G3, null,
];

// Pad chords triggered every 8 steps (one chord per bar)
const PAD_CHORDS: Record<number, number[]> = {
  0: [N.C4, N.E4, N.G4],
  8: [N.F3, N.C4, N.A4],
  16: [N.A3, N.E4, N.C5],
  24: [N.G3, N.D4, N.B4],
  32: [N.F3, N.A3, N.E4],
  40: [N.E3, N.B3, N.G4],
  48: [N.D3, N.A3, N.E4],
  56: [N.G3, N.C4, N.D4],
};

// Sparkling Celesta counter-melody (blooms in Climax / high streak / final 2 bottles)
const CELESTA_SEQ: Array<number | null> = [
  null, N.G5, null, N.C6,  null, N.E6, null, N.C6,
  null, N.A5, null, N.C6,  null, N.G5, null, null,
  null, N.E6, null, N.C6,  null, N.A5, null, N.G5,
  null, N.B5, null, N.D6,  null, N.G6, null, null,
  null, N.A5, null, N.E6,  null, N.C6, null, N.A5,
  null, N.B5, null, N.G6,  null, N.E6, null, null,
  null, N.A5, null, N.D6,  null, N.E6, null, N.C6,
  null, N.D6, null, N.G6,  null, N.E6, N.C6, null,
];

let bgmWanted = false;
let currentMood: BgmMood = 'home';
let bgmSchedulerTimer: ReturnType<typeof setInterval> | null = null;
let bgmDuckTimer: ReturnType<typeof setTimeout> | null = null;
let nextNoteTime = 0;
let seqStep = 0;

const MOOD_MIX: Record<
  BgmMood,
  { harp: number; melody: number; pad: number; bass: number; perc: number; celesta: number }
> = {
  home: { harp: 1.0, melody: 0.92, pad: 0.78, bass: 0.82, perc: 0.0001, celesta: 0.16 },
  flow: { harp: 0.88, melody: 0.22, pad: 0.82, bass: 0.72, perc: 0.0001, celesta: 0.08 },
  challenge: { harp: 0.92, melody: 0.35, pad: 0.72, bass: 1.0, perc: 0.85, celesta: 0.18 },
  climax: { harp: 0.96, melody: 0.58, pad: 0.86, bass: 0.92, perc: 0.62, celesta: 1.0 },
};

function applyMoodStems(g: AudioGraph, mood: BgmMood, rampSec = 0.85): void {
  const now = g.ctx.currentTime;
  const target = MOOD_MIX[mood];
  const ramp = (node: GainNode, val: number) => {
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(Math.max(0.0001, node.gain.value), now);
    node.gain.linearRampToValueAtTime(val, now + rampSec);
  };
  ramp(g.stemHarp, target.harp);
  ramp(g.stemMelody, target.melody);
  ramp(g.stemPad, target.pad);
  ramp(g.stemBass, target.bass);
  ramp(g.stemPerc, target.perc);
  ramp(g.stemCelesta, target.celesta);
}

export function getBgmMood(): BgmMood {
  return currentMood;
}

export function setBgmMood(mood: BgmMood): void {
  if (currentMood === mood) return;
  currentMood = mood;
  if (graph && bgmWanted) {
    applyMoodStems(graph, mood, 0.9);
  }
}

function scheduleSequencerStep(g: AudioGraph, stepIndex: number, when: number): void {
  const idx = stepIndex % 64;
  const cycleNum = Math.floor(stepIndex / 64);

  // 1. Harp arpeggio (gentle stereo weave)
  const harpFreq = HARP_SEQ[idx];
  if (harpFreq) {
    const pan = (idx % 4 - 1.5) * 0.18;
    const altOct = cycleNum % 2 === 1 && idx % 16 === 6 ? 2 : 1;
    playHarpNote(g, g.stemHarp, harpFreq * altOct, when, 0.145, 1.35, pan, 0.25);
  }

  // 2. Singing Marimba Melody (Home / Climax)
  const melFreq = MELODY_SEQ[idx];
  if (melFreq) {
    playMarimbaNote(g, g.stemMelody, melFreq, when, 0.13, 0.52, -0.14, 0.2);
  }

  // 3. Pizzicato Bass
  const bassFreq = BASS_SEQ[idx];
  if (bassFreq) {
    playPizzBassNote(g, g.stemBass, bassFreq, when, 0.21, 0.72);
  } else if (currentMood === 'challenge' && idx % 8 === 6) {
    // Extra rhythmic cello anticipation pulse on Challenge levels
    const prevBass = BASS_SEQ[idx - 2] ?? N.G3;
    playPizzBassNote(g, g.stemBass, prevBass * 1.5, when, 0.12, 0.35);
  }

  // 4. Conservatory Warm Pad (every bar)
  const chord = PAD_CHORDS[idx];
  if (chord) {
    playWarmPadChord(g, g.stemPad, chord, when, 0.052, STEP_SEC * 7.8);
  }

  // 5. Delicate wooden shaker rhythm (Challenge / Climax)
  if (idx % 2 === 0) {
    playSoftShaker(g, g.stemPerc, when, idx % 4 === 0);
  }

  // 6. Crystal Celesta shimmer counter-melody (Climax + subtle home sparkle)
  const celFreq = CELESTA_SEQ[idx];
  if (celFreq) {
    const pan = idx % 2 === 0 ? 0.26 : -0.22;
    playCelestaNote(g, g.stemCelesta, celFreq, when, 0.068, 1.15, pan, 0.42);
  }
}

function runLookAheadTick(): void {
  if (!bgmWanted || !graph) return;
  if (graph.ctx.state !== 'running') return;
  if (typeof document !== 'undefined' && document.hidden) return;

  const now = graph.ctx.currentTime;
  if (nextNoteTime < now - 0.15) {
    nextNoteTime = now + 0.04;
  }

  while (nextNoteTime < now + SCHEDULE_AHEAD_SEC) {
    scheduleSequencerStep(graph, seqStep, nextNoteTime);
    nextNoteTime += STEP_SEC;
    seqStep += 1;
  }
}

export function startBgm(enabled: boolean): void {
  bgmWanted = enabled;
  if (!enabled) {
    stopBgm();
    return;
  }
  const g = ensureGraph();
  if (!g) return;

  const now = g.ctx.currentTime;
  g.bgmBus.gain.cancelScheduledValues(now);
  g.bgmBus.gain.setValueAtTime(Math.max(0.0001, g.bgmBus.gain.value), now);
  g.bgmBus.gain.linearRampToValueAtTime(0.32, now + 0.85);
  applyMoodStems(g, currentMood, 0.65);

  if (!bgmSchedulerTimer) {
    nextNoteTime = now + 0.06;
    runLookAheadTick();
    bgmSchedulerTimer = setInterval(runLookAheadTick, LOOKAHEAD_MS);
  }
}

export function stopBgm(): void {
  bgmWanted = false;
  if (bgmSchedulerTimer) {
    clearInterval(bgmSchedulerTimer);
    bgmSchedulerTimer = null;
  }
  if (bgmDuckTimer) {
    clearTimeout(bgmDuckTimer);
    bgmDuckTimer = null;
  }
  if (graph) {
    const now = graph.ctx.currentTime;
    graph.bgmBus.gain.cancelScheduledValues(now);
    graph.bgmBus.gain.setValueAtTime(Math.max(0.0001, graph.bgmBus.gain.value), now);
    graph.bgmBus.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  }
}

export function duckBgm(durationMs = 700, depth = 0.46): void {
  if (!bgmWanted || !graph) return;
  const now = graph.ctx.currentTime;
  graph.bgmDuckGain.gain.cancelScheduledValues(now);
  graph.bgmDuckGain.gain.setValueAtTime(Math.max(0.05, graph.bgmDuckGain.gain.value), now);
  graph.bgmDuckGain.gain.linearRampToValueAtTime(depth, now + 0.07);

  if (bgmDuckTimer) clearTimeout(bgmDuckTimer);
  bgmDuckTimer = setTimeout(() => {
    bgmDuckTimer = null;
    if (!bgmWanted || !graph) return;
    const t = graph.ctx.currentTime;
    graph.bgmDuckGain.gain.cancelScheduledValues(t);
    graph.bgmDuckGain.gain.setValueAtTime(Math.max(0.05, graph.bgmDuckGain.gain.value), t);
    graph.bgmDuckGain.gain.linearRampToValueAtTime(1.0, t + 0.48);
  }, durationMs);
}

export function handleVisibilityAudioSync(bgmEnabled: boolean): void {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    if (graph && graph.ctx.state === 'running') {
      graph.ctx.suspend().catch(() => {});
    }
  } else {
    if (graph && graph.ctx.state === 'suspended') {
      graph.ctx.resume().catch(() => {});
    }
    if (bgmEnabled) {
      startBgm(true);
    }
  }
}

// ============================================================================
// Real ASMR Pour Buffer Loader + Fallback
// ============================================================================

export function stopPourSound(): void {
  activePourCleanup?.();
  activePourCleanup = null;
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
  const g = ensureGraph();
  if (!g) return;
  void loadPourBuffer(g.ctx);
}

/**
 * Synchronously unlocks Web Audio inside a user gesture handler (critical on iOS WKWebView/Safari)
 * and preloads the ASMR pour buffer.
 */
export function unlockAudioForGesture(startBgmIfEnabled: boolean): void {
  const g = ensureGraph();
  if (!g) return;
  void loadPourBuffer(g.ctx);
  if (startBgmIfEnabled) {
    startBgm(true);
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
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      // Ignore already disposed element
    }
    onDone?.();
  };

  el.addEventListener('ended', cleanup, { once: true });
  el.play().catch(cleanup);

  if (maxMs) {
    timer = setTimeout(cleanup, maxMs);
  }
  return cleanup;
}

// ============================================================================
// Tactile UI & Core Gameplay ASMR SFX
// ============================================================================

export function playUiClick(enabled: boolean, variant: UiClickVariant = 'primary'): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  const now = g.ctx.currentTime;
  const jitter = randRange(0.97, 1.03);

  if (variant === 'close') {
    playMarimbaNote(g, g.sfxBus, 523.25 * jitter, now, 0.085, 0.14, 0, 0.14);
    playMarimbaNote(g, g.sfxBus, 392.0 * jitter, now + 0.035, 0.07, 0.16, 0, 0.16);
  } else if (variant === 'tab') {
    playMarimbaNote(g, g.sfxBus, 659.25 * jitter, now, 0.08, 0.13, randRange(-0.15, 0.15), 0.14);
  } else {
    // Crisp tactile warm wood/marimba tap + subtle sparkle
    playMarimbaNote(g, g.sfxBus, 587.33 * jitter, now, 0.1, 0.15, 0, 0.16);
    playCelestaNote(g, g.sfxBus, 1174.66 * jitter, now + 0.015, 0.025, 0.16, 0, 0.22);
  }
}

/** Inharmonic borosilicate glass resonance clink when picking up a potion flask */
export function playPickupClink(enabled: boolean, pan?: number): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  preloadPourSounds();
  if (!acquireVoice(0.28)) return;

  const { ctx } = g;
  const now = ctx.currentTime;
  const pitchVar = randRange(0.94, 1.06);
  const gainVar = randRange(0.9, 1.1);
  const stereo = pan ?? randRange(-0.22, 0.22);

  const mix = ctx.createGain();
  // Real glass has non-integer modal partials (1.0x, 2.34x, 3.87x)
  const partials: Array<[number, number, number]> = [
    [980 * pitchVar, 0.085 * gainVar, 0.22],
    [2293 * pitchVar, 0.042 * gainVar, 0.16],
    [3792 * pitchVar, 0.02 * gainVar, 0.09],
  ];

  partials.forEach(([freq, amp, decay]) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(amp, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(env);
    env.connect(mix);
    osc.start(now);
    osc.stop(now + decay + 0.02);
  });

  // Microscopic crisp glass rim tap transient
  const tap = ctx.createBufferSource();
  tap.buffer = g.noiseBuffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.setValueAtTime(3600 * pitchVar, now);
  hp.Q.setValueAtTime(4.0, now);
  const tapGain = ctx.createGain();
  tapGain.gain.setValueAtTime(0.0001, now);
  tapGain.gain.linearRampToValueAtTime(0.04 * gainVar, now + 0.002);
  tapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
  tap.connect(hp);
  hp.connect(tapGain);
  tapGain.connect(mix);
  tap.start(now, randRange(0, 0.5), 0.025);

  connectWithPanAndReverb(g, mix, g.sfxBus, stereo, 0.28);
}

/** Polite soft double oak-wood knock when tapping a locked/empty bottle */
export function playErrorTap(enabled: boolean): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  if (!acquireVoice(0.24)) return;

  const { ctx } = g;
  const now = ctx.currentTime;
  const taps = [
    { offset: 0, startF: 190, endF: 145, amp: 0.11 },
    { offset: 0.075, startF: 150, endF: 112, amp: 0.085 },
  ];

  taps.forEach(({ offset, startF, endF, amp }) => {
    const t = now + offset;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startF, t);
    osc.frequency.exponentialRampToValueAtTime(endF, t + 0.075);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, t);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(amp, t + 0.009);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

    osc.connect(lp);
    lp.connect(env);
    connectWithPanAndReverb(g, env, g.sfxBus, 0, 0.12);
    osc.start(t);
    osc.stop(t + 0.12);
  });
}

/**
 * Hybrid ASMR Liquid Pour:
 * Layers real `asmr_bottle_glug.mp3` (high-pass + warmth sculpted) with a real-time
 * rising glass-vessel formant resonance sweep calibrated to target bottle fill level.
 */
export function playPourSound(
  enabled: boolean,
  layerCount: number,
  targetFillRatio = 0.5
): void {
  stopPourSound();
  if (!enabled) return;

  duckBgm(720, 0.58);

  const g = ensureGraph();
  const drops = Math.max(1, Math.min(4, layerCount));
  const fill = Math.max(0, Math.min(1, targetFillRatio));
  const rate = (drops === 1 ? 1.03 : drops === 2 ? 0.99 : 0.95) * randRange(0.985, 1.015);
  const startDelaySec = 0.13;
  const streamDurSec = Math.min(0.56, 0.36 + drops * 0.055);

  if (!g) {
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

  const { ctx } = g;

  // Subtle physical rising vessel resonance layer (makes fuller bottles ring brighter!)
  const startAt = ctx.currentTime + startDelaySec;
  let stopVesselLayer: (() => void) | null = null;
  if (acquireVoice(streamDurSec + 0.15)) {
    const startResFreq = 460 + fill * 360;
    const endResFreq = Math.min(1480, startResFreq + drops * 145);

    const noise = ctx.createBufferSource();
    noise.buffer = g.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(7.5, startAt);
    bp.frequency.setValueAtTime(startResFreq, startAt);
    bp.frequency.exponentialRampToValueAtTime(endResFreq, startAt + streamDurSec);

    const resGain = ctx.createGain();
    resGain.gain.setValueAtTime(0.0001, startAt);
    resGain.gain.linearRampToValueAtTime(0.065, startAt + 0.05);
    resGain.gain.setValueAtTime(0.065, startAt + Math.max(0.08, streamDurSec - 0.1));
    resGain.gain.exponentialRampToValueAtTime(0.0001, startAt + streamDurSec);

    noise.connect(bp);
    bp.connect(resGain);
    connectWithPanAndReverb(g, resGain, g.sfxBus, 0, 0.18);

    noise.start(startAt, randRange(0, 0.4), streamDurSec + 0.03);
    stopVesselLayer = () => {
      try {
        const now = ctx.currentTime;
        resGain.gain.cancelScheduledValues(now);
        resGain.gain.setValueAtTime(Math.max(0.0001, resGain.gain.value), now);
        resGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        noise.stop(now + 0.035);
      } catch {
        // already stopped
      }
    };
  }

  if (cachedPourBuffer) {
    const playDur = Math.min(cachedPourBuffer.duration / rate, streamDurSec);
    const src = ctx.createBufferSource();
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(140, startAt);

    const gain = ctx.createGain();
    src.buffer = cachedPourBuffer;
    src.playbackRate.setValueAtTime(rate, startAt);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(0.74, startAt + 0.035);
    gain.gain.setValueAtTime(0.74, startAt + Math.max(0.08, playDur - 0.11));
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + playDur);

    src.connect(hp);
    hp.connect(gain);
    connectWithPanAndReverb(g, gain, g.sfxBus, 0, 0.16);

    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      stopVesselLayer?.();
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
    stopVesselLayer?.();
    innerStop?.();
  };
}

/** Crisp air-column cork pop + tiny glass rim ring */
export function playCorkPop(enabled: boolean): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  if (!acquireVoice(0.24)) return;

  const { ctx } = g;
  const now = ctx.currentTime;
  const pitchVar = randRange(0.95, 1.05);

  // Ascending air-column thump ("bwoop-POP!")
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(145 * pitchVar, now);
  osc.frequency.exponentialRampToValueAtTime(440 * pitchVar, now + 0.068);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

  osc.connect(gain);
  connectWithPanAndReverb(g, gain, g.sfxBus, 0, 0.24);
  osc.start(now);
  osc.stop(now + 0.16);

  // Air release micro-burst at peak
  const puff = ctx.createBufferSource();
  puff.buffer = g.noiseBuffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(1600 * pitchVar, now + 0.048);
  bp.Q.setValueAtTime(2.0, now + 0.048);
  const pg = ctx.createGain();
  pg.gain.setValueAtTime(0.0001, now + 0.045);
  pg.gain.linearRampToValueAtTime(0.09, now + 0.055);
  pg.gain.exponentialRampToValueAtTime(0.0001, now + 0.105);

  puff.connect(bp);
  bp.connect(pg);
  connectWithPanAndReverb(g, pg, g.sfxBus, 0, 0.22);
  puff.start(now + 0.045, randRange(0, 0.5), 0.07);
}

/** Delicate ascending harp shimmer + airy mist brush when a ? mystery layer reveals */
export function playMysteryReveal(enabled: boolean): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  const now = g.ctx.currentTime;

  [N.E5, N.G5, N.B5, N.E6].forEach((freq, idx) => {
    playCelestaNote(g, g.sfxBus, freq, now + idx * 0.055, 0.065, 0.65, (idx - 1.5) * 0.18, 0.48);
  });

  // Soft mist dispersion swoosh
  if (acquireVoice(0.26)) {
    const src = g.ctx.createBufferSource();
    src.buffer = g.noiseBuffer;
    const bp = g.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(900, now);
    bp.frequency.exponentialRampToValueAtTime(3400, now + 0.22);
    bp.Q.setValueAtTime(2.4, now);
    const env = g.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.04, now + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    src.connect(bp);
    bp.connect(env);
    connectWithPanAndReverb(g, env, g.sfxBus, 0, 0.35);
    src.start(now, randRange(0, 0.5), 0.25);
  }
}

export function playObstacleUnlockSound(
  enabled: boolean,
  type: 'cork' | 'crate' | 'curtain'
): void {
  if (!enabled) return;
  if (type === 'cork') {
    playCorkPop(true);
    const g = ensureGraph();
    if (g) {
      playCelestaNote(g, g.sfxBus, N.G5, g.ctx.currentTime + 0.06, 0.07, 0.65, 0, 0.4);
    }
    return;
  }

  const g = ensureGraph();
  if (!g) return;
  const now = g.ctx.currentTime;

  if (type === 'crate') {
    // Dual woody snap bursts + metallic latch release bell
    [0, 0.065].forEach((offset, idx) => {
      if (!acquireVoice(0.16)) return;
      const t = now + offset;
      const noise = g.ctx.createBufferSource();
      noise.buffer = g.noiseBuffer;
      const bp = g.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(idx === 0 ? 780 : 1240, t);
      bp.Q.setValueAtTime(1.8, t);
      const env = g.ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(idx === 0 ? 0.16 : 0.13, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
      noise.connect(bp);
      bp.connect(env);
      connectWithPanAndReverb(g, env, g.sfxBus, idx === 0 ? -0.15 : 0.15, 0.22);
      noise.start(t, randRange(0, 0.4), 0.1);
    });
    playMarimbaNote(g, g.sfxBus, N.D5, now + 0.09, 0.12, 0.32, -0.1, 0.25);
    playCelestaNote(g, g.sfxBus, N.A5, now + 0.14, 0.08, 0.65, 0.14, 0.42);
  } else {
    // Silky velvet curtain sweep + dreamy ascending harp glissando
    if (acquireVoice(0.36)) {
      const noise = g.ctx.createBufferSource();
      noise.buffer = g.noiseBuffer;
      const bp = g.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(620, now);
      bp.frequency.exponentialRampToValueAtTime(2800, now + 0.3);
      bp.Q.setValueAtTime(1.6, now);
      const env = g.ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.055, now + 0.07);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      noise.connect(bp);
      bp.connect(env);
      connectWithPanAndReverb(g, env, g.sfxBus, 0, 0.35);
      noise.start(now, randRange(0, 0.4), 0.34);
    }
    [N.C5, N.E5, N.G5, N.A5, N.C6].forEach((f, idx) => {
      playHarpNote(g, g.sfxBus, f, now + idx * 0.048, 0.11, 0.85, (idx - 2) * 0.16, 0.42);
    });
  }
}

/** Rising harmonic seal chime on bottle completion with pentatonic combo ladder */
export function playSealRiseChime(enabled: boolean, comboStep = 0): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  duckBgm(920, 0.52);

  const now = g.ctx.currentTime;
  const mult = getPentatonicComboMultiplier(comboStep);
  const chord = [N.C5, N.E5, N.G5, N.C6];

  chord.forEach((base, idx) => {
    const t = now + idx * 0.095;
    playHarpNote(g, g.sfxBus, base * mult, t, 0.11, 0.9, (idx - 1.5) * 0.18, 0.4);
    if (idx >= 2) {
      playCelestaNote(g, g.sfxBus, base * mult, t + 0.02, 0.055, 0.95, (idx - 1.5) * 0.22, 0.48);
    }
  });
}

/** Joyful bottle seal chord ascending musically along C Major Pentatonic with comboStep */
export function playBottleComplete(enabled: boolean, comboStep = 0): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;

  const now = g.ctx.currentTime;
  const mult = getPentatonicComboMultiplier(comboStep);
  const baseNotes = [N.C5, N.E5, N.G5, N.C6];

  baseNotes.forEach((base, idx) => {
    const t = now + idx * 0.068;
    const freq = base * mult;
    playMarimbaNote(g, g.sfxBus, freq, t, 0.115, 0.42, (idx - 1.5) * 0.15, 0.26);
    if (idx === baseNotes.length - 1) {
      playCelestaNote(g, g.sfxBus, freq, t + 0.015, 0.08, 1.05, 0.18, 0.48);
    }
  });
}

// ============================================================================
// Dedicated Booster & Meta Ritual SFX
// ============================================================================

/** Time-rewind descending crystal droplet sweep for Undo booster */
export function playUndoSound(enabled: boolean): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  const now = g.ctx.currentTime;

  [N.G5, N.E5, N.C5].forEach((freq, idx) => {
    playMarimbaNote(g, g.sfxBus, freq, now + idx * 0.055, 0.1, 0.22, (1 - idx) * 0.18, 0.28);
  });
  playCelestaNote(g, g.sfxBus, N.C5, now + 0.15, 0.05, 0.45, -0.15, 0.38);
}

/** Cascading glass bottle rattle + magical swirl for Shuffle booster */
export function playShuffleSound(enabled: boolean): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  duckBgm(750, 0.6);
  const now = g.ctx.currentTime;

  // Staggered glass clinks mimicking flasks swirling in air
  const notes = [N.E5, N.G5, N.D5, N.A5, N.C6];
  notes.forEach((freq, idx) => {
    const t = now + idx * 0.058;
    const pan = (idx % 2 === 0 ? -1 : 1) * (0.35 - idx * 0.04);
    playCelestaNote(g, g.sfxBus, freq * randRange(0.98, 1.02), t, 0.065, 0.42, pan, 0.36);
    playHarpNote(g, g.sfxBus, freq * 0.5, t + 0.015, 0.09, 0.55, -pan * 0.5, 0.32);
  });
}

/** Solid glass placement clink + warm golden bloom for Extra Bottle booster */
export function playAddBottleSound(enabled: boolean): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  const now = g.ctx.currentTime;

  playPickupClink(true, 0);
  playHarpNote(g, g.sfxBus, N.F4, now + 0.05, 0.14, 0.9, -0.15, 0.38);
  playHarpNote(g, g.sfxBus, N.A4, now + 0.1, 0.14, 0.9, 0, 0.38);
  playCelestaNote(g, g.sfxBus, N.C6, now + 0.16, 0.09, 1.1, 0.18, 0.5);
}

/** Bubbling cauldron transmutation chord for Sun Alembic crafting */
export function playAlembicBrewSound(enabled: boolean): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  duckBgm(1000, 0.52);
  const now = g.ctx.currentTime;

  // 3 rapid rising cauldron bubble pops
  [0, 0.08, 0.15].forEach((offset, idx) => {
    if (!acquireVoice(0.14)) return;
    const t = now + offset;
    const osc = g.ctx.createOscillator();
    const env = g.ctx.createGain();
    osc.type = 'sine';
    const base = 240 + idx * 95;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 2.1, t + 0.065);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(0.12, t + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(env);
    connectWithPanAndReverb(g, env, g.sfxBus, (idx - 1) * 0.2, 0.28);
    osc.start(t);
    osc.stop(t + 0.1);
  });

  // Golden alchemy transmutation chord bloom (Fmaj9)
  [N.F4, N.A4, N.C5, N.E5, N.G5, N.C6].forEach((freq, idx) => {
    const t = now + 0.22 + idx * 0.055;
    playHarpNote(g, g.sfxBus, freq, t, 0.13, 1.25, (idx - 2.5) * 0.14, 0.42);
    if (idx >= 3) {
      playCelestaNote(g, g.sfxBus, freq, t + 0.02, 0.065, 1.3, (idx - 2.5) * 0.18, 0.5);
    }
  });
}

/** Treasured codex flourish for CG Achievement reward claim */
export function playAchievementUnlockSound(enabled: boolean, isClaimAll = false): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  duckBgm(1100, 0.5);
  const now = g.ctx.currentTime;

  const arp = isClaimAll
    ? [N.C5, N.E5, N.G5, N.A5, N.C6, N.E6]
    : [N.C5, N.E5, N.G5, N.C6];
  arp.forEach((freq, idx) => {
    const t = now + idx * 0.065;
    playHarpNote(g, g.sfxBus, freq, t, 0.13, 1.1, (idx - 2) * 0.14, 0.42);
    playCelestaNote(g, g.sfxBus, freq, t + 0.02, 0.07, 1.2, (idx - 2) * 0.16, 0.5);
  });
}

/** 7-Day Login Calendar check-in (crisp stamp or Day 7 grand jackpot cascade) */
export function playDailyCheckInSound(enabled: boolean, isGrandJackpot = false): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  const now = g.ctx.currentTime;

  if (!isGrandJackpot) {
    playMarimbaNote(g, g.sfxBus, N.C5, now, 0.14, 0.28, -0.1, 0.22);
    playMarimbaNote(g, g.sfxBus, N.G5, now + 0.08, 0.15, 0.4, 0.1, 0.26);
    playCelestaNote(g, g.sfxBus, N.C6, now + 0.15, 0.085, 0.85, 0, 0.45);
  } else {
    // Grand Day 7 Jackpot celebration
    duckBgm(1600, 0.4);
    playWarmPadChord(g, g.sfxBus, [N.C4, N.E4, N.G4, N.B4], now, 0.09, 1.8);
    [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6, N.E6].forEach((freq, idx) => {
      const t = now + idx * 0.072;
      playHarpNote(g, g.sfxBus, freq, t, 0.14, 1.25, (idx - 3) * 0.14, 0.45);
      playCelestaNote(g, g.sfxBus, freq, t + 0.025, 0.085, 1.4, (idx - 3) * 0.16, 0.52);
    });
  }
}

/** Warm regal workshop gold-chime for Shop purchases & Remove Ads unlock */
export function playShopPurchaseSound(enabled: boolean): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  duckBgm(900, 0.55);
  const now = g.ctx.currentTime;

  playHarpNote(g, g.sfxBus, N.G4, now, 0.14, 0.9, -0.18, 0.36);
  playHarpNote(g, g.sfxBus, N.C5, now + 0.06, 0.14, 0.95, 0, 0.36);
  playCelestaNote(g, g.sfxBus, N.E5, now + 0.12, 0.09, 1.15, 0.15, 0.48);
  playCelestaNote(g, g.sfxBus, N.C6, now + 0.19, 0.1, 1.35, 0, 0.52);
}

/** Crisp ascending metallic coin chime for fly-in HUD counters */
export function playCoinTick(enabled: boolean, index = 0): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;
  const now = g.ctx.currentTime;
  const mult = getPentatonicComboMultiplier(Math.min(6, index));
  const freq = 1046.5 * mult * randRange(0.99, 1.01);
  playCelestaNote(g, g.sfxBus, freq, now, 0.068, 0.28, randRange(-0.24, 0.24), 0.3);
}

// ============================================================================
// 3-Tier Victory Fanfares & 3-Tier Comedic Defeat Stingers (Matched to 6 CGs)
// ============================================================================

/**
 * 3-Tier Victory Music matching the 3 Victory CG Tiers:
 * - Tier 1 (初酿微光, ~1.8s): Fresh sunlit harp triad + playful marimba cadence
 * - Tier 2 (琉璃华彩, ~2.4s): Warm pad swell + dual-voice marimba/celesta counterpoint
 * - Tier 3 (星辉圣酿, ~3.2s): Grand conservatory festival fanfare with maj9 bloom & starlight chimes
 */
export function playVictoryFanfare(enabled: boolean, tier: CgTier = 1): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;

  const duckMs = tier === 3 ? 3200 : tier === 2 ? 2400 : 1850;
  duckBgm(duckMs, 0.25);
  const now = g.ctx.currentTime;

  if (tier === 1) {
    playPizzBassNote(g, g.sfxBus, N.C3, now, 0.22, 0.65);
    playPizzBassNote(g, g.sfxBus, N.G3, now + 0.42, 0.2, 0.65);
    playPizzBassNote(g, g.sfxBus, N.C3, now + 0.78, 0.24, 0.95);

    const lead = [
      { f: N.C5, t: 0.0, d: 0.35 },
      { f: N.E5, t: 0.14, d: 0.35 },
      { f: N.G5, t: 0.28, d: 0.38 },
      { f: N.A5, t: 0.44, d: 0.38 },
      { f: N.C6, t: 0.76, d: 1.05 },
    ];
    lead.forEach((n, idx) => {
      playMarimbaNote(g, g.sfxBus, n.f, now + n.t, 0.15, n.d, (idx - 2) * 0.12, 0.28);
      playHarpNote(g, g.sfxBus, n.f * 0.5, now + n.t, 0.12, n.d + 0.5, 0, 0.38);
    });
    playCelestaNote(g, g.sfxBus, N.E6, now + 0.82, 0.075, 1.05, 0.22, 0.5);
    return;
  }

  if (tier === 2) {
    playWarmPadChord(g, g.sfxBus, [N.F3, N.A3, N.C4, N.E4], now, 0.085, 1.15);
    playWarmPadChord(g, g.sfxBus, [N.C4, N.E4, N.G4, N.B4], now + 0.95, 0.1, 1.55);

    playPizzBassNote(g, g.sfxBus, N.F3, now, 0.24, 0.7);
    playPizzBassNote(g, g.sfxBus, N.G3, now + 0.48, 0.24, 0.7);
    playPizzBassNote(g, g.sfxBus, N.C3, now + 0.96, 0.26, 1.2);

    const melody = [
      { f: N.C5, t: 0.0 },
      { f: N.E5, t: 0.13 },
      { f: N.G5, t: 0.26 },
      { f: N.A5, t: 0.48 },
      { f: N.B5, t: 0.68 },
      { f: N.C6, t: 0.96 },
    ];
    melody.forEach((m, idx) => {
      playMarimbaNote(g, g.sfxBus, m.f, now + m.t, 0.15, 0.55, -0.14, 0.3);
      playHarpNote(g, g.sfxBus, m.f, now + m.t + 0.02, 0.12, 1.15, 0.16, 0.42);
      if (idx >= 3) {
        playCelestaNote(g, g.sfxBus, m.f, now + m.t + 0.04, 0.075, 1.25, (idx - 4) * 0.22, 0.5);
      }
    });
    // Prismatic final harp sweep
    [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, idx) => {
      playCelestaNote(g, g.sfxBus, f, now + 1.04 + idx * 0.065, 0.068, 1.25, (idx - 2) * 0.18, 0.52);
    });
    return;
  }

  // Tier 3 — Starlight Elixir Grand Conservatory Fanfare (~3.2s)
  playWarmPadChord(g, g.sfxBus, [N.F3, N.C4, N.A4], now, 0.09, 1.1);
  playWarmPadChord(g, g.sfxBus, [N.G3, N.D4, N.B4], now + 0.72, 0.095, 1.0);
  playWarmPadChord(g, g.sfxBus, [N.C4, N.E4, N.G4, N.D5], now + 1.38, 0.115, 1.9);

  playPizzBassNote(g, g.sfxBus, N.F3, now, 0.25, 0.75);
  playPizzBassNote(g, g.sfxBus, N.G3, now + 0.72, 0.25, 0.75);
  playPizzBassNote(g, g.sfxBus, N.C3, now + 1.38, 0.28, 1.5);

  // Opening lush harp flourish
  [N.C4, N.E4, N.G4, N.A4, N.C5, N.E5, N.G5].forEach((f, idx) => {
    playHarpNote(g, g.sfxBus, f, now + idx * 0.055, 0.13, 1.2, (idx - 3) * 0.14, 0.44);
  });

  // Heroic climbing phrase
  const phrase = [
    { f: N.G5, t: 0.42 },
    { f: N.A5, t: 0.6 },
    { f: N.B5, t: 0.78 },
    { f: N.C6, t: 1.02 },
    { f: N.D6, t: 1.18 },
    { f: N.E6, t: 1.38 },
  ];
  phrase.forEach((p, idx) => {
    playMarimbaNote(g, g.sfxBus, p.f * 0.5, now + p.t, 0.15, 0.58, -0.15, 0.3);
    playHarpNote(g, g.sfxBus, p.f, now + p.t, 0.13, 1.35, 0.12, 0.46);
    playCelestaNote(g, g.sfxBus, p.f, now + p.t + 0.02, 0.085, 1.45, (idx - 2.5) * 0.15, 0.55);
  });

  // Starlight glass chime cascade tail
  [N.G5, N.C6, N.D6, N.E6, N.G6].forEach((f, idx) => {
    playCelestaNote(g, g.sfxBus, f, now + 1.65 + idx * 0.095, 0.072, 1.45, (idx - 2) * 0.22, 0.58);
  });
}

/**
 * 3-Tier Comedic Defeat Music matching the 3 Hilarious Mishap CG Tiers:
 * - Tier 1 (微烟乍起, ~1.4s): Playful bassoon "uh-oh" droop + soft steam puff
 * - Tier 2 (药泡溢桌, ~1.9s): Elastic cartoon bubbles + mischievous descending trio
 * - Tier 3 (魔药炸炉, ~2.3s): Bouncy cartoon cauldron "poof-boing" + wobbly slide + warm encouraging bounce!
 */
export function playDefeatChime(enabled: boolean, tier: CgTier = 1): void {
  if (!enabled) return;
  const g = ensureGraph();
  if (!g) return;

  const duckMs = tier === 3 ? 2350 : tier === 2 ? 1950 : 1450;
  duckBgm(duckMs, 0.3);
  const now = g.ctx.currentTime;

  if (tier === 1) {
    // Gentle playful "uh-oh" bassoon droop
    playBassoonNote(g, g.sfxBus, N.E4, N.D4, now, 0.15, 0.32);
    playBassoonNote(g, g.sfxBus, N.D4, N.C4 * 0.96, now + 0.34, 0.15, 0.52);
    playPizzBassNote(g, g.sfxBus, N.C3, now + 0.34, 0.18, 0.55);

    // Tiny puff of cauldron smoke
    if (acquireVoice(0.35)) {
      const puff = g.ctx.createBufferSource();
      puff.buffer = g.noiseBuffer;
      const bp = g.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1400, now + 0.62);
      bp.frequency.exponentialRampToValueAtTime(520, now + 0.96);
      bp.Q.setValueAtTime(1.4, now + 0.62);
      const env = g.ctx.createGain();
      env.gain.setValueAtTime(0.0001, now + 0.62);
      env.gain.linearRampToValueAtTime(0.055, now + 0.68);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.98);
      puff.connect(bp);
      bp.connect(env);
      connectWithPanAndReverb(g, env, g.sfxBus, 0.1, 0.25);
      puff.start(now + 0.62, randRange(0, 0.3), 0.38);
    }
    return;
  }

  if (tier === 2) {
    // Elastic cartoon bubble overflow pops ("bloop-bloop-pop!")
    [
      { t: 0.0, f1: 220, f2: 560, pan: -0.22 },
      { t: 0.14, f1: 290, f2: 680, pan: 0.22 },
      { t: 0.28, f1: 250, f2: 790, pan: -0.05 },
    ].forEach(({ t, f1, f2, pan }) => {
      if (!acquireVoice(0.16)) return;
      const osc = g.ctx.createOscillator();
      const env = g.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f1, now + t);
      osc.frequency.exponentialRampToValueAtTime(f2, now + t + 0.085);
      env.gain.setValueAtTime(0.0001, now + t);
      env.gain.linearRampToValueAtTime(0.14, now + t + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.11);
      osc.connect(env);
      connectWithPanAndReverb(g, env, g.sfxBus, pan, 0.26);
      osc.start(now + t);
      osc.stop(now + t + 0.12);
    });

    // Mischievous descending woodwind sigh
    playBassoonNote(g, g.sfxBus, N.G4, N.F4, now + 0.42, 0.15, 0.28);
    playBassoonNote(g, g.sfxBus, N.E4, N.D4, now + 0.72, 0.15, 0.3);
    playBassoonNote(g, g.sfxBus, N.D4, N.C4, now + 1.04, 0.16, 0.56);
    playPizzBassNote(g, g.sfxBus, N.G3, now + 0.42, 0.18, 0.4);
    playPizzBassNote(g, g.sfxBus, N.C3, now + 1.04, 0.2, 0.65);
    return;
  }

  // Tier 3 — Full Cauldron Boom Comedy + Warm Encouraging Resolve Note (~2.3s)
  // 1. Soft bouncy cartoon "poof-BOING" cauldron thump
  if (acquireVoice(0.45)) {
    const thump = g.ctx.createOscillator();
    const env = g.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(165, now);
    thump.frequency.exponentialRampToValueAtTime(62, now + 0.18);
    thump.frequency.exponentialRampToValueAtTime(118, now + 0.32); // comedic spring bounce!
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.26, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    thump.connect(env);
    connectWithPanAndReverb(g, env, g.sfxBus, 0, 0.25);
    thump.start(now);
    thump.stop(now + 0.4);

    // Comedic foam poof noise
    const poof = g.ctx.createBufferSource();
    poof.buffer = g.noiseBuffer;
    const lp = g.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1600, now);
    lp.frequency.exponentialRampToValueAtTime(340, now + 0.28);
    const pEnv = g.ctx.createGain();
    pEnv.gain.setValueAtTime(0.0001, now);
    pEnv.gain.linearRampToValueAtTime(0.14, now + 0.018);
    pEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    poof.connect(lp);
    lp.connect(pEnv);
    connectWithPanAndReverb(g, pEnv, g.sfxBus, 0, 0.3);
    poof.start(now, randRange(0, 0.3), 0.34);
  }

  // 2. Wobbly descending cartoon bassoon phrase
  playBassoonNote(g, g.sfxBus, N.F4, N.E4, now + 0.34, 0.16, 0.26);
  playBassoonNote(g, g.sfxBus, N.E4 * 0.94, N.D4, now + 0.62, 0.16, 0.28);
  playBassoonNote(g, g.sfxBus, N.C4, N.A3, now + 0.94, 0.16, 0.44);

  // 3. Warm encouraging major-3rd bounce ("Let's try again!")
  playMarimbaNote(g, g.sfxBus, N.C5, now + 1.46, 0.12, 0.32, -0.12, 0.3);
  playCelestaNote(g, g.sfxBus, N.E5, now + 1.62, 0.095, 0.68, 0.14, 0.48);
  playHarpNote(g, g.sfxBus, N.G5, now + 1.68, 0.09, 0.65, 0.2, 0.46);
}
