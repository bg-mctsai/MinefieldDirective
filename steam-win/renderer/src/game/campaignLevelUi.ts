import type { Level } from '../gameLogic';
import { chapterCampaignTagline } from './levelStrategyGuideModel';
import { stageInChapter } from './chapterStage';

export { stageInChapter } from './chapterStage';

/** 僅章內關次（對局內若還要章名請用 `campaignLevelHeaderTitle`） */
export function campaignLevelStageLabel(level: Level): string {
  return `第 ${stageInChapter(level.id, level.definition.chapter)} 關`;
}

/**
 * 對局頂欄等：章節標語 · 第 N 關；若有外置／內嵌 `mapTheme`（戰場主題短名）則為
 * `… · 第 N 關-鑰匙孔` 形式。
 */
export function campaignLevelHeaderTitle(level: Level): string {
  const tag = chapterCampaignTagline(level.definition.chapter).trim();
  const stage = campaignLevelStageLabel(level);
  const theme = level.definition.mapTheme?.trim();
  const stagePart = theme ? `${stage}-${theme}` : stage;
  return tag ? `${tag} · ${stagePart}` : stagePart;
}
