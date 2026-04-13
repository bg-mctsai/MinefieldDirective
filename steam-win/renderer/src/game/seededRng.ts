export interface SeededRng {
  next(): number;
  nextInt(maxExclusive: number): number;
  state(): number;
}

function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

export function createSeededRngFromSeed(seed: string): SeededRng {
  return createSeededRngFromState(hashSeed(seed));
}

export function createSeededRngFromState(initialState: number): SeededRng {
  let state = initialState >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    nextInt(maxExclusive: number): number {
      if (maxExclusive <= 1) return 0;
      return Math.floor(this.next() * maxExclusive);
    },
    state(): number {
      return state >>> 0;
    },
  };
}

export function shuffleWithRng<T>(items: T[], rng: SeededRng): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
