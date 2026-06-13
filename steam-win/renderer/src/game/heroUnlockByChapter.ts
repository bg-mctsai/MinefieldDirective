import table from '../levelData/heroUnlockByChapter.json';

type Table = { onLevelCleared: Record<string, string[]> };

const t = table as Table;

export function heroIdsUnlockedOnLevelCleared(levelKey: string): string[] {
  const key = levelKey.trim();
  if (!key) return [];
  return t.onLevelCleared[key] ?? [];
}

/** 企劃表：幹員首次可玩所需通關關卡（levelKey，如 2_5、3_8），找不到則為 null */
export function requiredLevelKeyForHero(heroId: string): string | null {
  for (const [levelKey, ids] of Object.entries(t.onLevelCleared)) {
    if (ids.includes(heroId)) return levelKey;
  }
  return null;
}

/** 未解鎖幹員在 UI 顯示的條件文案 */
export function heroUnlockRequirementHint(heroId: string): string | null {
  const levelKey = requiredLevelKeyForHero(heroId);
  if (!levelKey) return null;
  const m = /^(\d+)_(\d+)$/.exec(levelKey);
  if (!m) return `通關 ${levelKey} 解鎖`;
  const chapter = Number.parseInt(m[1], 10);
  const stage = Number.parseInt(m[2], 10);
  if (!Number.isFinite(chapter) || !Number.isFinite(stage)) return `通關 ${levelKey} 解鎖`;
  if (stage === 8) return `通關第 ${chapter} 章整章解鎖`;
  return `通關第 ${chapter} 章第 ${stage} 關解鎖`;
}
