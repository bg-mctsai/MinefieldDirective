import { MEDAL_RANK, type Medal } from './medalThresholds';

export const LS_CLEARED_LEVEL_KEYS = 'md:clearedLevelKeys';
export const LS_BEST_MEDAL_BY_LEVEL_KEY = 'md:bestMedalByLevelKey';

const FORCE_UNLOCK_ALL_LEVELS = import.meta.env.VITE_UNLOCK_ALL_LEVELS?.trim() === '1';

export type GameProgress = {
  clearedLevelKeys: string[];
  /** 可選：寫入時若省略則不覆蓋既有勳章（避免 saveGameProgress 把已記錄的 bestMedal 清空） */
  bestMedalByLevelKey?: Record<string, Medal>;
};

function normalizeLevelKeyList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== 'string') continue;
    const key = v.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

function isMedal(v: unknown): v is Medal {
  return v === 'bronze' || v === 'silver' || v === 'gold';
}

function normalizeMedalMap(raw: unknown): Record<string, Medal> {
  const out: Record<string, Medal> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = k.trim();
    if (!key) continue;
    if (isMedal(v)) out[key] = v;
  }
  return out;
}

export function loadGameProgress(): GameProgress {
  let clearedLevelKeys: string[] = [];
  let bestMedalByLevelKey: Record<string, Medal> = {};
  try {
    const raw = localStorage.getItem(LS_CLEARED_LEVEL_KEYS);
    if (raw != null) clearedLevelKeys = normalizeLevelKeyList(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(LS_BEST_MEDAL_BY_LEVEL_KEY);
    if (raw != null) bestMedalByLevelKey = normalizeMedalMap(JSON.parse(raw));
  } catch {
    /* ignore */
  }

  return {
    clearedLevelKeys,
    bestMedalByLevelKey,
  };
}

export function saveGameProgress(progress: GameProgress) {
  try {
    localStorage.setItem(LS_CLEARED_LEVEL_KEYS, JSON.stringify(normalizeLevelKeyList(progress.clearedLevelKeys)));
  } catch {
    /* ignore */
  }
  if (progress.bestMedalByLevelKey !== undefined) {
    try {
      localStorage.setItem(LS_BEST_MEDAL_BY_LEVEL_KEY, JSON.stringify(normalizeMedalMap(progress.bestMedalByLevelKey)));
    } catch {
      /* ignore */
    }
  }
}

export function nextPlayableLevelKey(clearedLevelKeys: string[], orderedLevelKeys: string[]): string | null {
  if (orderedLevelKeys.length === 0) return null;
  const idxByKey = new Map<string, number>();
  for (let i = 0; i < orderedLevelKeys.length; i += 1) idxByKey.set(orderedLevelKeys[i]!, i);
  let furthest = -1;
  for (const key of new Set(clearedLevelKeys)) {
    const idx = idxByKey.get(key);
    if (idx != null && idx > furthest) furthest = idx;
  }
  const nextIdx = Math.min(orderedLevelKeys.length - 1, furthest + 1);
  return orderedLevelKeys[nextIdx] ?? null;
}

export function isLevelUnlocked(levelKey: string, clearedLevelKeys: string[], orderedLevelKeys: string[]): boolean {
  if (FORCE_UNLOCK_ALL_LEVELS) return true;
  if (!levelKey) return false;
  if (orderedLevelKeys.length === 0) return false;
  const next = nextPlayableLevelKey(clearedLevelKeys, orderedLevelKeys);
  if (next == null) return false;
  return levelKey === next || clearedLevelKeys.includes(levelKey);
}

/**
 * 寫入單關最佳勳章；只升不降（gold > silver > bronze）。
 * 回傳寫入後的最佳勳章（可能維持舊值）。
 */
export function recordMedal(levelKey: string, medal: Medal): Medal {
  const key = levelKey.trim();
  if (!key) return medal;
  let map: Record<string, Medal> = {};
  try {
    const raw = localStorage.getItem(LS_BEST_MEDAL_BY_LEVEL_KEY);
    if (raw != null) map = normalizeMedalMap(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  const prev = map[key];
  const next: Medal = prev && MEDAL_RANK[prev] >= MEDAL_RANK[medal] ? prev : medal;
  map[key] = next;
  try {
    localStorage.setItem(LS_BEST_MEDAL_BY_LEVEL_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return next;
}

export function getBestMedal(levelKey: string): Medal | null {
  const key = levelKey.trim();
  if (!key) return null;
  try {
    const raw = localStorage.getItem(LS_BEST_MEDAL_BY_LEVEL_KEY);
    if (raw == null) return null;
    const map = normalizeMedalMap(JSON.parse(raw));
    return map[key] ?? null;
  } catch {
    return null;
  }
}

export function getAllBestMedals(): Record<string, Medal> {
  try {
    const raw = localStorage.getItem(LS_BEST_MEDAL_BY_LEVEL_KEY);
    if (raw == null) return {};
    return normalizeMedalMap(JSON.parse(raw));
  } catch {
    return {};
  }
}
