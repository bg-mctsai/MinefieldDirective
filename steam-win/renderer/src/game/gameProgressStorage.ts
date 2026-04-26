export const LS_HIGHEST_CLEARED_LEVEL = 'md:highestClearedLevel';

export const LEVEL_MIN = 1;
export const LEVEL_MAX = 100;
const FORCE_UNLOCK_ALL_LEVELS = import.meta.env.VITE_UNLOCK_ALL_LEVELS?.trim() === '1';

export type GameProgress = {
  highestClearedLevel: number; // 0..100 (0 means no level cleared)
};

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  const v = Math.trunc(n);
  return Math.min(max, Math.max(min, v));
}

export function normalizeHighestClearedLevel(v: number): number {
  return clampInt(v, 0, LEVEL_MAX);
}

export function loadGameProgress(): GameProgress {
  let highestClearedLevel = 0;
  try {
    const raw = localStorage.getItem(LS_HIGHEST_CLEARED_LEVEL);
    if (raw != null) highestClearedLevel = parseInt(raw, 10);
  } catch {
    /* ignore */
  }

  return { highestClearedLevel: normalizeHighestClearedLevel(highestClearedLevel) };
}

export function saveGameProgress(progress: GameProgress) {
  try {
    localStorage.setItem(LS_HIGHEST_CLEARED_LEVEL, String(normalizeHighestClearedLevel(progress.highestClearedLevel)));
  } catch {
    /* ignore */
  }
}

export function isLevelUnlocked(levelId: number, highestClearedLevel: number): boolean {
  if (FORCE_UNLOCK_ALL_LEVELS) return true;
  if (!Number.isFinite(levelId)) return false;
  const id = clampInt(levelId, LEVEL_MIN, LEVEL_MAX);
  const unlockedMax = highestClearedLevel + 1;
  return id <= unlockedMax;
}

