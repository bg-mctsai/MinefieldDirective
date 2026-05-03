import type { Level } from '../gameLogic';
import { chapterCampaignTagline } from './levelStrategyGuideModel';
import { stageInChapter } from './chapterStage';

export { stageInChapter } from './chapterStage';

/** 僅章內關次（對局內若還要章名請用 `campaignLevelHeaderTitle`） */
export function campaignLevelStageLabel(level: Level): string {
  return `第 ${stageInChapter(level.id, level.definition.chapter)} 關`;
}

/**
 * 對局頂欄等：章節標語(章內關次)；若有 `mapTheme`（戰場主題短名）則附加 `-主題`。
 * 例如：`新兵訓練(2)-長條`
 */
export function campaignLevelHeaderTitle(level: Level): string {
  const tag = chapterCampaignTagline(level.definition.chapter).trim();
  const stage = stageInChapter(level.id, level.definition.chapter);
  const theme = level.definition.mapTheme?.trim();
  const stagePart = `${tag}(${stage})`;
  return theme ? `${stagePart}-${theme}` : stagePart;
}
