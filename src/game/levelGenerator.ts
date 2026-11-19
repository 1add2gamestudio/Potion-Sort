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

function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function getDifficultyForLevel(levelNumber: number): DifficultyTier {
  if (levelNumber >= 10 && levelNumber % 10 === 0) return 'super_hard';
  if (levelNumber >= 5 && levelNumber % 5 === 0) return 'hard';
  return 'normal';
}

function getColorCountForLevel(levelNumber: number, difficulty: DifficultyTier): number {
  if (levelNumber === 1) return 2;
  if (levelNumber === 2) return 3;
  if (levelNumber <= 4) return 4;
  if (levelNumber <= 9) return difficulty === 'hard' ? 5 : 4;
  if (levelNumber <= 17) return difficulty === 'super_hard' ? 6 : 5;
  if (levelNumber <= 29) return difficulty === 'super_hard' ? 7 : 6;
  return difficulty === 'super_hard' ? 7 : 6;
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
        { color: 'coral', hidden: false },
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
  colorCount: number,
  difficulty: DifficultyTier
): Bottle[] {
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

  const emptyCount = difficulty === 'super_hard' && colorCount >= 6 ? 2 : 2;
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
    // Swap one layer between bottle 0 and bottle 1
    const first = bottles[0].layers[BOTTLE_CAPACITY - 1];
    bottles[0].layers[BOTTLE_CAPACITY - 1] = bottles[1].layers[0];
    bottles[1].layers[0] = first;
  }

  // Mystery '?' layers from Level 6+
  if (levelNumber >= 6) {
    const mysteryBottleCount =
      levelNumber >= 20 ? 3 : levelNumber >= 12 ? 2 : 1;
    const hideDepth = levelNumber >= 16 ? 2 : 1;
    for (let m = 0; m < Math.min(mysteryBottleCount, colorCount); m++) {
      const idx = Math.floor(rng() * colorCount);
      for (let d = 0; d < hideDepth; d++) {
        bottles[idx].layers[d].hidden = true;
      }
    }
  }

  // Corked bottle from Level 12+ (only when we have a spare open slot & avoid soft-locking)
  if (levelNumber >= 12) {
    // Pick a partially emptied bottle shape: move top layer from one filled bottle to an empty bottle?
    // Better: take an empty bottle? No, corked bottle must have < 4 layers so you can pour INTO it!
    // Move top layer of bottle[0] into empty bottle[colorCount] so bottle[0] has 3 layers and empty[0] has 1 layer,
    // OR leave empty[0] empty and cork empty[0] with requiredColor = top visible color of bottle[1]!
    const targetCorkIdx = colorCount; // First empty bottle
    const donorColor = bottles[1].layers[BOTTLE_CAPACITY - 1].color;
    bottles[targetCorkIdx].obstacle = { type: 'cork', requiredColor: donorColor };
  }

  // Color-padlocked crate from Level 18+
  if (levelNumber >= 18) {
    // Lock bottle[colorCount - 1], unlocked by completing a different color (colors[0])
    const lockedIdx = colorCount - 1;
    // Choose a lockColor that does NOT appear as majority inside lockedIdx if possible, or pick colors[0]
    const lockColor = colors[0];
    // Ensure lockColor isn't stuck inside the locked bottle itself (so player CAN complete lockColor without opening the crate!)
    const hasLockColorInside = bottles[lockedIdx].layers.some((l) => l.color === lockColor);
    if (!hasLockColorInside) {
      bottles[lockedIdx].obstacle = { type: 'crate', lockColor };
    } else {
      // Swap out any lockColor layers from lockedIdx with non-lockColor layers in bottle 0
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

  // Velvet curtain bottle from Level 24+
  if (levelNumber >= 24 && colorCount >= 5) {
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

  const difficulty = getDifficultyForLevel(safeLevel);
  const colorCount = getColorCountForLevel(safeLevel, difficulty);

  let verifiedBottles: Bottle[] | null = null;
  if (safeLevel === 1) {
    verifiedBottles = buildHandcraftedLevel1();
  } else {
    for (let attempt = 0; attempt < 40; attempt++) {
      const candidate = generateCandidateBottles(safeLevel, attempt, colorCount, difficulty);
      if (solveLevel(candidate, 12000) !== null) {
        verifiedBottles = candidate;
        break;
      }
    }
    // Safe fallback without obstacles if a rare high-color attempt exceeded budget
    if (!verifiedBottles) {
      for (let attempt = 100; attempt < 130; attempt++) {
        const fallback = generateCandidateBottles(1, attempt, colorCount, 'normal');
        if (solveLevel(fallback, 12000) !== null) {
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
  if (safeLevel === 6) mechanicsIntroduced.push('Mystery "?" Layers');
  if (safeLevel === 12) mechanicsIntroduced.push('Corked Decanters');
  if (safeLevel === 18) mechanicsIntroduced.push('Color-Padlocked Crates');
  if (safeLevel === 24) mechanicsIntroduced.push('Velvet Curtain Bottles');

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
    mappedLevel: 6,
    starReward: 8,
  },
  {
    id: 'trial-cork',
    name: 'Sealed Solarium',
    subtitle: 'Pour matching hue to pop the cork',
    difficulty: 'hard',
    mappedLevel: 12,
    starReward: 12,
  },
  {
    id: 'trial-crate',
    name: 'Gilded Vaults',
    subtitle: 'Complete a full flask to unlock padlocks',
    difficulty: 'hard',
    mappedLevel: 18,
    starReward: 15,
  },
  {
    id: 'trial-curtain',
    name: 'Curtain Finale',
    subtitle: 'All obstacles combined · Super Hard',
    difficulty: 'super_hard',
    mappedLevel: 24,
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
