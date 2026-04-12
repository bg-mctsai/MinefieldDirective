import type { Level } from '../gameLogic';
import { chapterCampaignTagline } from './levelStrategyGuideModel';
import { stageInChapter } from './chapterStage';

export { stageInChapter } from './chapterStage';

/** 僅章內關次（對局內若還要章名請用 `campaignLevelHeaderTitle`） */
export function campaignLevelStageLabel(level: Level): string {
  return `第 ${stageInChapter(level.id, level.definition.chapter)} 關`;
}

/** 對局頂欄等：章節標題 + 章內關次 */
export function campaignLevelHeaderTitle(level: Level): string {
  const tag = chapterCampaignTagline(level.definition.chapter).trim();
  const stage = campaignLevelStageLabel(level);
  return tag ? `${tag} · ${stage}` : stage;
}
