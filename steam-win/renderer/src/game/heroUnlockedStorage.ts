import { useEffect, useMemo, useState } from 'react';
import { effectiveUnlockedHeroIds, HERO_DEV_UNLOCK_CHANGED } from '../heroDevUnlock';
import { loadGameProgress } from './gameProgressStorage';
import { heroIdsUnlockedOnLevelCleared } from './heroUnlockByChapter';

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

/** 含 DEV「開放全部幹員」覆寫；實際存檔仍見 loadUnlockedHeroIds。 */
export function getEffectiveUnlockedHeroIds(): string[] {
  return effectiveUnlockedHeroIds(loadUnlockedHeroIds(), ALL_OFFICER_IDS);
}

export function isHeroIdUnlocked(heroId: string): boolean {
  return new Set(getEffectiveUnlockedHeroIds()).has(heroId);
}

/** 訂閱 DEV 幹員解鎖覆寫切換，供 UI 重算可選幹員。 */
export function useEffectiveUnlockedHeroIds(): string[] {
  const [rev, setRev] = useState(0);
  useEffect(() => {
    const onChange = () => setRev((n) => n + 1);
    window.addEventListener(HERO_DEV_UNLOCK_CHANGED, onChange);
    return () => window.removeEventListener(HERO_DEV_UNLOCK_CHANGED, onChange);
  }, []);
  return useMemo(() => getEffectiveUnlockedHeroIds(), [rev]);
}

/**
 * 通關指定 levelKey 且勝利時，合併企劃表解鎖的幹員 id。可重入、冪等。
 * @returns 本次新解鎖的幹員 id（供戰後對話等；重玩已解鎖關卡時為空陣列）
 */
export function mergeUnlockedOnLevelCleared(levelKey: string): string[] {
  const extra = heroIdsUnlockedOnLevelCleared(levelKey);
  if (extra.length === 0) return [];
  const cur = new Set(loadUnlockedHeroIds());
  const newly: string[] = [];
  for (const id of extra) {
    if (isValidId(id) && !cur.has(id)) {
      cur.add(id);
      newly.push(id);
    }
  }
  if (newly.length > 0) saveUnlocked([...cur]);
  return newly;
}
