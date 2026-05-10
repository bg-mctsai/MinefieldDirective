/** 章內第幾關（1-based）；優先採用關卡定義中的 `stage`，不再依賴全域流水號推導。 */
export const LEVELS_PER_CHAPTER = 8;

export function stageInChapter(stage: number): number {
  return Math.max(1, Math.floor(stage || 1));
}
