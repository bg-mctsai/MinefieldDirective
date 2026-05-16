import type { Level } from '../gameLogic';
import { chapterCampaignTagline } from './levelStrategyGuideModel';
import { stageInChapter } from './chapterStage';

/** 關卡識別（與存檔／mapRef 一致，如 `5_3`）— 僅程式／存檔用，不作玩家標題 */
export function campaignLevelKeyLabel(level: Level): string {
  return level.levelKey;
}

/** 作戰地圖節點／頻道：僅章內關次數字（1～8） */
export function campaignMapStageLabel(level: Level): string {
  return String(stageInChapter(level.stage));
}

/** @deprecated 請改用 `campaignLevelKeyLabel` */
export function campaignLevelStageLabel(level: Level): string {
  return campaignLevelKeyLabel(level);
}

/**
 * 玩家可見關卡標題：`章節名-戰場主題`（非 `levelKey`）。
 * 例如：`蜂巢防線-祕鑰巢穴`
 */
export function campaignLevelDisplayTitle(level: Level): string {
  const tag = chapterCampaignTagline(level.definition.chapter).trim();
  const theme = level.definition.mapTheme?.trim();
  if (tag && theme) return `${tag}-${theme}`;
  if (theme) return theme;
  if (tag) return tag;
  return level.levelKey;
}

/** 對局頂欄、關卡側欄 */
export function campaignLevelHeaderTitle(level: Level): string {
  return campaignLevelDisplayTitle(level);
}

/** 首頁「戰役接續」：主標＝章節名-主題；副標＝章內關次（1～8） */
export function campaignHomeContinueLabels(level: Level): { heading: string; stageLabel: string } {
  return { heading: campaignLevelDisplayTitle(level), stageLabel: campaignMapStageLabel(level) };
}
