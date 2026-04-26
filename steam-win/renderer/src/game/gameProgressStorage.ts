import { MEDAL_RANK, type Medal } from './medalThresholds';

export const LS_HIGHEST_CLEARED_LEVEL = 'md:highestClearedLevel';
export const LS_BEST_MEDAL_BY_LEVEL = 'md:bestMedalByLevel';

export const LEVEL_MIN = 1;
export const LEVEL_MAX = 100;
const FORCE_UNLOCK_ALL_LEVELS = import.meta.env.VITE_UNLOCK_ALL_LEVELS?.trim() === '1';

export type GameProgress = {
  highestClearedLevel: number; // 0..100 (0 means no level cleared)
  /** 可選：寫入時若省略則不覆蓋既有勳章（避免 saveGameProgress 把已記錄的 bestMedal 清空） */
  bestMedalByLevel?: Record<number, Medal>;
};

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  const v = Math.trunc(n);
  return Math.min(max, Math.max(min, v));
}

export function normalizeHighestClearedLevel(v: number): number {
  return clampInt(v, 0, LEVEL_MAX);
}

function isMedal(v: unknown): v is Medal {
  return v === 'bronze' || v === 'silver' || v === 'gold';
}

function normalizeMedalMap(raw: unknown): Record<number, Medal> {
  const out: Record<number, Medal> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number.parseInt(k, 10);
    if (!Number.isFinite(id) || id < LEVEL_MIN || id > LEVEL_MAX) continue;
    if (isMedal(v)) out[id] = v;
  }
  return out;
}

export function loadGameProgress(): GameProgress {
  let highestClearedLevel = 0;
  let bestMedalByLevel: Record<number, Medal> = {};
  try {
    const raw = localStorage.getItem(LS_HIGHEST_CLEARED_LEVEL);
    if (raw != null) highestClearedLevel = parseInt(raw, 10);
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(LS_BEST_MEDAL_BY_LEVEL);
    if (raw != null) bestMedalByLevel = normalizeMedalMap(JSON.parse(raw));
  } catch {
    /* ignore */
  }

  return {
    highestClearedLevel: normalizeHighestClearedLevel(highestClearedLevel),
    bestMedalByLevel,
  };
}

export function saveGameProgress(progress: GameProgress) {
  try {
    localStorage.setItem(LS_HIGHEST_CLEARED_LEVEL, String(normalizeHighestClearedLevel(progress.highestClearedLevel)));
  } catch {
    /* ignore */
  }
  if (progress.bestMedalByLevel !== undefined) {
    try {
      localStorage.setItem(LS_BEST_MEDAL_BY_LEVEL, JSON.stringify(progress.bestMedalByLevel));
    } catch {
      /* ignore */
    }
  }
}

export function isLevelUnlocked(levelId: number, highestClearedLevel: number): boolean {
  if (FORCE_UNLOCK_ALL_LEVELS) return true;
  if (!Number.isFinite(levelId)) return false;
  const id = clampInt(levelId, LEVEL_MIN, LEVEL_MAX);
  const unlockedMax = highestClearedLevel + 1;
  return id <= unlockedMax;
}

/**
 * 寫入單關最佳勳章；只升不降（gold > silver > bronze）。
 * 回傳寫入後的最佳勳章（可能維持舊值）。
 */
export function recordMedal(levelId: number, medal: Medal): Medal {
  const id = clampInt(levelId, LEVEL_MIN, LEVEL_MAX);
  let map: Record<number, Medal> = {};
  try {
    const raw = localStorage.getItem(LS_BEST_MEDAL_BY_LEVEL);
    if (raw != null) map = normalizeMedalMap(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  const prev = map[id];
  const next: Medal = prev && MEDAL_RANK[prev] >= MEDAL_RANK[medal] ? prev : medal;
  map[id] = next;
  try {
    localStorage.setItem(LS_BEST_MEDAL_BY_LEVEL, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return next;
}

export function getBestMedal(levelId: number): Medal | null {
  const id = clampInt(levelId, LEVEL_MIN, LEVEL_MAX);
  try {
    const raw = localStorage.getItem(LS_BEST_MEDAL_BY_LEVEL);
    if (raw == null) return null;
    const map = normalizeMedalMap(JSON.parse(raw));
    return map[id] ?? null;
  } catch {
    return null;
  }
}

export function getAllBestMedals(): Record<number, Medal> {
  try {
    const raw = localStorage.getItem(LS_BEST_MEDAL_BY_LEVEL);
    if (raw == null) return {};
    return normalizeMedalMap(JSON.parse(raw));
  } catch {
    return {};
  }
}
