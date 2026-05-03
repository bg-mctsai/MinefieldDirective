import table from '../levelData/heroUnlockByChapter.json';

type Table = { onChapterCleared: Record<string, string[]> };

const t = table as Table;

export function heroIdsUnlockedOnChapterCleared(chapter: number): string[] {
  const c = Math.floor(chapter);
  if (!Number.isFinite(c) || c < 1) return [];
  return t.onChapterCleared[String(c)] ?? [];
}

/** 企劃表：幹員首次可玩所需通關章（通關該章第 8 關），找不到則為 null */
export function requiredCompletedChapterForHero(heroId: string): number | null {
  for (const [ch, ids] of Object.entries(t.onChapterCleared)) {
    if (ids.includes(heroId)) return Number.parseInt(ch, 10) || null;
  }
  return null;
}
