import type { LevelDefinition } from './levelData/types';

/** 作戰地圖用：由關卡定義組一句「敵情／威脅」摘要（無獨立敵軍表時由機制欄位推導） */
export function missionEnemySituationLine(def: LevelDefinition): string {
  const parts: string[] = [];
  if (def.blastPoints?.length) parts.push(`定時炸點 ×${def.blastPoints.length}`);
  if (def.digitOutposts?.length) parts.push(`數字據點 ×${def.digitOutposts.length}`);
  if (def.dynamicMinePerMove) parts.push('動態廢雷');
  if (def.forcedMineCells?.length) parts.push(`固定雷格 ×${def.forcedMineCells.length}`);
  if (def.commandSlotReceiveJamming) parts.push('電碼干擾');
  if (def.neighborPlacedDigitBonus) parts.push('鄰位加成');
  if (parts.length) return parts.join(' · ');
  return '隱匿雷場 · 邏輯毗邻威脅（雷數由戰情種子固定）';
}

/** 戰情列用：敵情縮寫（圖標旁顯示），完整說明請用 {@link missionEnemySituationLine} 作 title */
export function missionEnemyIntelAbbrev(def: LevelDefinition): string {
  const chips: string[] = [];
  if (def.blastPoints?.length) chips.push(`BP×${def.blastPoints.length}`);
  if (def.digitOutposts?.length) chips.push(`DO×${def.digitOutposts.length}`);
  if (def.dynamicMinePerMove) chips.push('DM');
  if (def.forcedMineCells?.length) chips.push(`FM×${def.forcedMineCells.length}`);
  if (def.commandSlotReceiveJamming) chips.push('ECM');
  if (def.neighborPlacedDigitBonus) chips.push('NB+');
  return chips.length ? chips.join(' ') : 'STD';
}
