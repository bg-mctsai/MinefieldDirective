import { loadGameProgress } from './gameProgressStorage';
import { heroIdsUnlockedOnChapterCleared } from './heroUnlockByChapter';

const LS = 'md:unlockedHeroIds';
/** 與 heroes.ts 內 HEROES 同序，供遷移「全幹員」不 import heroes 避免循環匯入 */
const ALL_OFFICER_IDS: readonly string[] = [
  'xiaoming',
  'ada',
  'selina',
  'bobby',
  'laozhang',
  'tungsten',
  'claire',
];
const DEFAULT_START = 'xiaoming';

function isValidId(id: string): id is (typeof ALL_OFFICER_IDS)[number] {
  return ALL_OFFICER_IDS.includes(id);
}

function normalizeList(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!isValidId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  for (const must of [DEFAULT_START]) {
    if (!out.includes(must)) out.unshift(must);
  }
  return out;
}

/**
 * 首次讀寫前：無 key 時，若舊存檔已有戰役進度則視為前版（全幹員開放）並一鍵遷移；否則新檔只開小明。
 */
export function loadUnlockedHeroIds(): string[] {
  try {
    const raw = localStorage.getItem(LS);
    if (raw == null) {
      const clearedCount = loadGameProgress().clearedLevelKeys.length;
      const list = clearedCount > 0 ? normalizeList([...ALL_OFFICER_IDS]) : [DEFAULT_START];
      try {
        localStorage.setItem(LS, JSON.stringify(list));
      } catch {
        /* ignore */
      }
      return list;
    }
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) {
      const fallback = [DEFAULT_START];
      try {
        localStorage.setItem(LS, JSON.stringify(fallback));
      } catch {
        /* ignore */
      }
      return fallback;
    }
    const n = normalizeList(
      (arr as unknown[]).filter((x): x is string => typeof x === 'string'),
    );
    const toSave = n.length > 0 ? n : [DEFAULT_START];
    if (raw !== JSON.stringify(toSave)) {
      try {
        localStorage.setItem(LS, JSON.stringify(toSave));
      } catch {
        /* ignore */
      }
    }
    return toSave;
  } catch {
    return [DEFAULT_START];
  }
}

function saveUnlocked(list: string[]) {
  const n = normalizeList(list);
  try {
    localStorage.setItem(LS, JSON.stringify(n));
  } catch {
    /* ignore */
  }
}

export function isHeroIdUnlocked(heroId: string): boolean {
  return new Set(loadUnlockedHeroIds()).has(heroId);
}

/**
 * 通關第 chapter 章整章（剛通關該章第 8 關且勝利）時，合併企劃表解鎖的幹員 id。可重入、冪等。
 */
export function mergeUnlockedOnChapterCleared(chapter: number): void {
  const extra = heroIdsUnlockedOnChapterCleared(chapter);
  if (extra.length === 0) return;
  const cur = new Set(loadUnlockedHeroIds());
  let ch = false;
  for (const id of extra) {
    if (isValidId(id) && !cur.has(id)) {
      cur.add(id);
      ch = true;
    }
  }
  if (ch) saveUnlocked([...cur]);
}
