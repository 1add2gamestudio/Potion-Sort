import { isBottleComplete } from './engine';
import { solveLevel } from './solver';
import {
  BOTTLE_CAPACITY,
  type Bottle,
  type DifficultyTier,
  type IngredientId,
  type LevelSpec,
  type PotionColor,
} from './types';

const COLOR_ORDER: PotionColor[] = [
  'coral',
  'seafoam',
  'citron',
  'azure',
  'iris',
  'rose',
  'jade',
];

const INGREDIENT_CYCLE: IngredientId[] = ['citrus', 'crystal', 'dew', 'mist'];

const POTION_ORDERS: string[] = [
  'Sunburst Elixir',
  'Skywing Tonic',
  'Honeyberry Brew',
  'Starlight Draught',
  'Dewdrop Nectar',
  'Velvet Mist Vial',
  'Dragonfruit Fizz',
  'Amber Hearth Potion',
  'Gilded Clover Blend',
  'Royal Solstice Brew',
];

export interface SawtoothLevelProfile {
  colorCount: number;
  difficulty: DifficultyTier;
  mysteryBottles: number;
  hideDepth: number;
  hasCork: boolean;
  hasCrate: boolean;
  hasCurtain: boolean;
  minSolutionMoves: number;
}

function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Plan B — Golden Wave Sawtooth Difficulty Curve:
 * - L1: 2 colors, 5-move handcrafted tutorial
 * - L2: SHARP SPIKE -> 5 colors high-mix board (>=16 moves)
 * - L3: Slight dip / relief -> 4 colors breezy streak builder
 * - L4: Ramp up -> 5 colors + Mystery '?' intro
 * - L5: Hard Peak -> 6 colors + 2 Mystery bottles
 * - L6: Relief + Cork tutorial -> 4 colors + Cork
 * - L7..L9: 5 colors+Cork -> 6 colors+Mystery -> 5 colors pre-boss dip
 * - L10: Super Hard Boss -> 7 colors + Mystery + Cork + Crate intro
 * - L11..L15: 5+Crate -> 6+Mystery+Cork -> 5+Crate dip -> 5+Curtain intro -> 6 Hard multi-obstacle
 * - L16+: Repeating 5-level Golden Wave Sawtooth (Relief -> Step-Up -> Dip -> Ramp-Up -> Hard/Super-Hard Peak)
 */
export function getSawtoothProfile(levelNumber: number): SawtoothLevelProfile {
  const n = Math.max(1, Math.floor(levelNumber));

  switch (n) {
    case 1:
      return {
        colorCount: 2,
        difficulty: 'normal',
        mysteryBottles: 1,
        hideDepth: 1,
        hasCork: false,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 2:
      return {
        colorCount: 5,
        difficulty: 'normal',
        mysteryBottles: 4,
        hideDepth: 2,
        hasCork: false,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 16,
      };
    case 3:
      return {
        colorCount: 4,
        difficulty: 'normal',
        mysteryBottles: 3,
        hideDepth: 2,
        hasCork: false,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 4:
      return {
        colorCount: 5,
        difficulty: 'normal',
        mysteryBottles: 4,
        hideDepth: 3,
        hasCork: false,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 5:
      return {
        colorCount: 6,
        difficulty: 'hard',
        mysteryBottles: 5,
        hideDepth: 3,
        hasCork: false,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 18,
      };
    case 6:
      return {
        colorCount: 4,
        difficulty: 'normal',
        mysteryBottles: 3,
        hideDepth: 2,
        hasCork: true,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 7:
      return {
        colorCount: 5,
        difficulty: 'normal',
        mysteryBottles: 4,
        hideDepth: 2,
        hasCork: true,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 8:
      return {
        colorCount: 6,
        difficulty: 'normal',
        mysteryBottles: 5,
        hideDepth: 3,
        hasCork: false,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 9:
      return {
        colorCount: 5,
        difficulty: 'normal',
        mysteryBottles: 4,
        hideDepth: 2,
        hasCork: true,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 10:
      return {
        colorCount: 7,
        difficulty: 'super_hard',
        mysteryBottles: 6,
        hideDepth: 3,
        hasCork: true,
        hasCrate: true,
        hasCurtain: false,
        minSolutionMoves: 20,
      };
    case 11:
      return {
        colorCount: 5,
        difficulty: 'normal',
        mysteryBottles: 4,
        hideDepth: 2,
        hasCork: false,
        hasCrate: true,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 12:
      return {
        colorCount: 6,
        difficulty: 'normal',
        mysteryBottles: 5,
        hideDepth: 3,
        hasCork: true,
        hasCrate: false,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 13:
      return {
        colorCount: 5,
        difficulty: 'normal',
        mysteryBottles: 4,
        hideDepth: 2,
        hasCork: false,
        hasCrate: true,
        hasCurtain: false,
        minSolutionMoves: 0,
      };
    case 14:
      return {
        colorCount: 5,
        difficulty: 'normal',
        mysteryBottles: 4,
        hideDepth: 2,
        hasCork: false,
        hasCrate: false,
        hasCurtain: true,
        minSolutionMoves: 0,
      };
    case 15:
      return {
        colorCount: 6,
        difficulty: 'hard',
        mysteryBottles: 5,
        hideDepth: 3,
        hasCork: true,
        hasCrate: false,
        hasCurtain: true,
        minSolutionMoves: 18,
      };
    default: {
      // L16+ repeating 5-level Golden Wave Sawtooth with rich blind-box mystery density
      const pos = (n - 1) % 5; // 0: relief, 1: step-up, 2: dip, 3: ramp-up, 4: peak
      const baseColors = n >= 26 ? 6 : 5;

      if (pos === 0) {
        return {
          colorCount: baseColors,
          difficulty: 'normal',
          mysteryBottles: baseColors - 1,
          hideDepth: 2,
          hasCork: n % 2 === 0,
          hasCrate: n % 2 === 1,
          hasCurtain: false,
          minSolutionMoves: 0,
        };
      }
      if (pos === 1) {
        const cc = Math.min(7, baseColors + 1);
        return {
          colorCount: cc,
          difficulty: 'normal',
          mysteryBottles: cc - 1,
          hideDepth: 3,
          hasCork: true,
          hasCrate: false,
          hasCurtain: n >= 22,
          minSolutionMoves: 0,
        };
      }
      if (pos === 2) {
        return {
          colorCount: baseColors,
          difficulty: 'normal',
          mysteryBottles: baseColors - 1,
          hideDepth: 2,
          hasCork: false,
          hasCrate: true,
          hasCurtain: false,
          minSolutionMoves: 0,
        };
      }
      if (pos === 3) {
        const cc = Math.min(7, baseColors + 1);
        return {
          colorCount: cc,
          difficulty: 'normal',
          mysteryBottles: cc - 1,
          hideDepth: 3,
          hasCork: false,
          hasCrate: true,
          hasCurtain: true,
          minSolutionMoves: 0,
        };
      }
      const isSuperHard = n % 10 === 0;
      return {
        colorCount: 7,
        difficulty: isSuperHard ? 'super_hard' : 'hard',
        mysteryBottles: 7,
        hideDepth: 3,
        hasCork: true,
        hasCrate: true,
        hasCurtain: true,
        minSolutionMoves: isSuperHard ? 20 : 18,
      };
    }
  }
}

function buildHandcraftedLevel1(): Bottle[] {
  return [
    {
      id: 'b1',
      layers: [
        { color: 'coral', hidden: false },
        { color: 'coral', hidden: false },
        { color: 'azure', hidden: false },
      ],
      obstacle: { type: 'none' },
    },
    {
      id: 'b2',
      layers: [
        { color: 'azure', hidden: false },
        { color: 'azure', hidden: false },
        { color: 'coral', hidden: false },
      ],
      obstacle: { type: 'none' },
    },
    {
      id: 'b3',
      layers: [
        { color: 'coral', hidden: true },
        { color: 'azure', hidden: false },
      ],
      obstacle: { type: 'none' },
    },
    {
      id: 'b4',
      layers: [],
      obstacle: { type: 'none' },
    },
  ];
}

function generateCandidateBottles(
  levelNumber: number,
  attempt: number,
  profile: SawtoothLevelProfile
): Bottle[] {
  const { colorCount, mysteryBottles, hideDepth, hasCork, hasCrate, hasCurtain } = profile;
  const rng = createRng(
    Math.imul(levelNumber + 17, 2654435761) ^ Math.imul(attempt + 1, 1597334677)
  );
  const colors = COLOR_ORDER.slice(0, colorCount);

  // Deal 4 layers of each color into a pool and shuffle
  const pool: PotionColor[] = [];
  for (const c of colors) {
    for (let k = 0; k < BOTTLE_CAPACITY; k++) pool.push(c);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const emptyCount = 2;
  const bottles: Bottle[] = [];

  for (let i = 0; i < colorCount; i++) {
    const chunk = pool.slice(i * BOTTLE_CAPACITY, (i + 1) * BOTTLE_CAPACITY);
    bottles.push({
      id: `b${i + 1}`,
      layers: chunk.map((color) => ({ color, hidden: false })),
      obstacle: { type: 'none' },
    });
  }

  for (let e = 0; e < emptyCount; e++) {
    bottles.push({
      id: `b${colorCount + e + 1}`,
      layers: [],
      obstacle: { type: 'none' },
    });
  }

  // Ensure no bottle starts already solved
  if (bottles.some((b) => isBottleComplete(b))) {
    const first = bottles[0].layers[BOTTLE_CAPACITY - 1];
    bottles[0].layers[BOTTLE_CAPACITY - 1] = bottles[1].layers[0];
    bottles[1].layers[0] = first;
  }

  // Mystery '?' layers
  if (mysteryBottles > 0 && hideDepth > 0) {
    const picked = new Set<number>();
    const targetCount = Math.min(mysteryBottles, colorCount);
    let guard = 0;
    while (picked.size < targetCount && guard < 24) {
      picked.add(Math.floor(rng() * colorCount));
      guard++;
    }
    for (const idx of picked) {
      for (let d = 0; d < Math.min(hideDepth, BOTTLE_CAPACITY - 1); d++) {
        bottles[idx].layers[d].hidden = true;
      }
    }
  }

  // Corked empty bottle (unlocked by pouring donorColor into it)
  if (hasCork) {
    const targetCorkIdx = colorCount;
    const donorColor = bottles[1].layers[BOTTLE_CAPACITY - 1].color;
    bottles[targetCorkIdx].obstacle = { type: 'cork', requiredColor: donorColor };
  }

  // Color-padlocked crate (unlocked by completing lockColor elsewhere)
  if (hasCrate) {
    const lockedIdx = colorCount - 1;
    const lockColor = colors[0];
    const hasLockColorInside = bottles[lockedIdx].layers.some((l) => l.color === lockColor);
    if (!hasLockColorInside) {
      bottles[lockedIdx].obstacle = { type: 'crate', lockColor };
    } else {
      for (let k = 0; k < BOTTLE_CAPACITY; k++) {
        if (bottles[lockedIdx].layers[k].color === lockColor) {
          const swapIdx = bottles[0].layers.findIndex((l) => l.color !== lockColor);
          if (swapIdx !== -1) {
            const tmp = bottles[lockedIdx].layers[k].color;
            bottles[lockedIdx].layers[k].color = bottles[0].layers[swapIdx].color;
            bottles[0].layers[swapIdx].color = tmp;
          }
        }
      }
      if (!bottles[lockedIdx].layers.some((l) => l.color === lockColor)) {
        bottles[lockedIdx].obstacle = { type: 'crate', lockColor };
      }
    }
  }

  // Velvet curtain bottle (unlocked by completing unlockColor elsewhere)
  if (hasCurtain && colorCount >= 5) {
    const curtainIdx = colorCount - 2;
    const unlockColor = colors[1];
    for (let k = 0; k < BOTTLE_CAPACITY; k++) {
      if (bottles[curtainIdx].layers[k].color === unlockColor) {
        const swapIdx = bottles[0].layers.findIndex(
          (l) => l.color !== unlockColor && l.color !== colors[0]
        );
        if (swapIdx !== -1) {
          const tmp = bottles[curtainIdx].layers[k].color;
          bottles[curtainIdx].layers[k].color = bottles[0].layers[swapIdx].color;
          bottles[0].layers[swapIdx].color = tmp;
        }
      }
    }
    if (!bottles[curtainIdx].layers.some((l) => l.color === unlockColor)) {
      bottles[curtainIdx].obstacle = { type: 'curtain', unlockColor };
    }
  }

  return bottles;
}

const LEVEL_CACHE = new Map<number, LevelSpec>();

export function getLevelSpec(levelNumber: number): LevelSpec {
  const safeLevel = Math.max(1, Math.floor(levelNumber));
  const cached = LEVEL_CACHE.get(safeLevel);
  if (cached) {
    return {
      ...cached,
      bottles: cached.bottles.map((b) => ({
        ...b,
        layers: b.layers.map((l) => ({ ...l })),
        obstacle: { ...b.obstacle },
      })),
    };
  }

  const profile = getSawtoothProfile(safeLevel);
  const { colorCount, difficulty, minSolutionMoves } = profile;

  let verifiedBottles: Bottle[] | null = null;
  if (safeLevel === 1) {
    verifiedBottles = buildHandcraftedLevel1();
  } else {
    let bestFallback: { bottles: Bottle[]; moves: number } | null = null;
    for (let attempt = 0; attempt < 48; attempt++) {
      const candidate = generateCandidateBottles(safeLevel, attempt, profile);
      const sol = solveLevel(candidate, 14000);
      if (sol !== null) {
        if (sol.length >= minSolutionMoves) {
          verifiedBottles = candidate;
          break;
        }
        if (!bestFallback || sol.length > bestFallback.moves) {
          bestFallback = { bottles: candidate, moves: sol.length };
        }
      }
    }
    if (!verifiedBottles && bestFallback) {
      verifiedBottles = bestFallback.bottles;
    }
    // Safe fallback without blocking obstacles while preserving rich mystery '?' layers
    if (!verifiedBottles) {
      const plainProfile: SawtoothLevelProfile = {
        ...profile,
        hasCork: false,
        hasCrate: false,
        hasCurtain: false,
        mysteryBottles: Math.max(2, profile.mysteryBottles - 1),
        hideDepth: Math.max(2, profile.hideDepth - 1),
      };
      for (let attempt = 100; attempt < 130; attempt++) {
        const fallback = generateCandidateBottles(safeLevel, attempt, plainProfile);
        if (solveLevel(fallback, 14000) !== null) {
          verifiedBottles = fallback;
          break;
        }
      }
    }
    if (!verifiedBottles) {
      verifiedBottles = buildHandcraftedLevel1();
    }
  }

  const mechanicsIntroduced: string[] = [];
  if (safeLevel === 1) mechanicsIntroduced.push('Tap-to-Pour Basics');
  if (safeLevel === 2) mechanicsIntroduced.push('Mystery "?" Layers');
  if (safeLevel === 6) mechanicsIntroduced.push('Corked Decanters');
  if (safeLevel === 10) mechanicsIntroduced.push('Color-Padlocked Crates');
  if (safeLevel === 14) mechanicsIntroduced.push('Velvet Curtain Bottles');

  const rewardCoins =
    difficulty === 'super_hard' ? 120 : difficulty === 'hard' ? 75 : 40;

  const spec: LevelSpec = {
    levelNumber: safeLevel,
    title: `Level ${safeLevel}`,
    potionOrderName: POTION_ORDERS[(safeLevel - 1) % POTION_ORDERS.length],
    difficulty,
    colorCount,
    bottles: verifiedBottles,
    rewardCoins,
    rewardIngredient: INGREDIENT_CYCLE[(safeLevel - 1) % INGREDIENT_CYCLE.length],
    mechanicsIntroduced,
  };

  LEVEL_CACHE.set(safeLevel, spec);
  return {
    ...spec,
    bottles: spec.bottles.map((b) => ({
      ...b,
      layers: b.layers.map((l) => ({ ...l })),
      obstacle: { ...b.obstacle },
    })),
  };
}

export interface EventTrialMeta {
  id: string;
  name: string;
  subtitle: string;
  difficulty: DifficultyTier;
  mappedLevel: number;
  starReward: number;
}

export const EVENT_TRIALS: EventTrialMeta[] = [
  {
    id: 'trial-mystery',
    name: 'Veiled Essences',
    subtitle: 'Mystery "?" layers fixed per board',
    difficulty: 'normal',
    mappedLevel: 4,
    starReward: 8,
  },
  {
    id: 'trial-cork',
    name: 'Sealed Solarium',
    subtitle: 'Pour matching hue to pop the cork',
    difficulty: 'hard',
    mappedLevel: 6,
    starReward: 12,
  },
  {
    id: 'trial-crate',
    name: 'Gilded Vaults',
    subtitle: 'Complete a full flask to unlock padlocks',
    difficulty: 'hard',
    mappedLevel: 10,
    starReward: 15,
  },
  {
    id: 'trial-curtain',
    name: 'Curtain Finale',
    subtitle: 'All obstacles combined · Super Hard',
    difficulty: 'super_hard',
    mappedLevel: 14,
    starReward: 20,
  },
];

export function getTrialLevelSpec(trialId: string): LevelSpec {
  const meta = EVENT_TRIALS.find((t) => t.id === trialId) ?? EVENT_TRIALS[0];
  const base = getLevelSpec(meta.mappedLevel);
  return {
    ...base,
    title: meta.name,
    potionOrderName: meta.subtitle,
    difficulty: meta.difficulty,
  };
}
