/** 章內第幾關（1～8），與 `levels.json` 的 `chapter`／`levelId` 對齊規則一致；無 UI 依賴，供多處共用。 */
export const LEVELS_PER_CHAPTER = 8;

export function stageInChapter(levelId: number, chapter: number): number {
  const ch = Math.floor(chapter);
  if (!Number.isFinite(ch) || ch < 1) return Math.min(LEVELS_PER_CHAPTER, Math.max(1, levelId));
  return Math.min(LEVELS_PER_CHAPTER, Math.max(1, levelId - (ch - 1) * LEVELS_PER_CHAPTER));
}
