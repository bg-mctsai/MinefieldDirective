import type { Level } from '../gameLogic';
import { chapterCampaignTagline } from './levelStrategyGuideModel';
import { stageInChapter } from './chapterStage';

const CHAPTER_NUMERALS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] as const;

function chapterToChineseNumeral(chapter: number): string {
  if (chapter >= 0 && chapter < CHAPTER_NUMERALS.length) return CHAPTER_NUMERALS[chapter]!;
  return String(chapter);
}

/** 戰場頂欄章節定位，例如「第八章第5關」 */
export function campaignLevelChapterStageLabel(level: Level): string {
  const chapter = level.definition.chapter;
  const stage = stageInChapter(level.stage);
  return `第${chapterToChineseNumeral(chapter)}章第${stage}關`;
}

export type CampaignBattlefieldHeaderLabels = {
  chapterStage: string;
  missionTitle: string;
};

/** 戰場頂欄：章節關次＋任務主題標題 */
export function campaignLevelBattlefieldHeaderLabels(level: Level): CampaignBattlefieldHeaderLabels {
  return {
    chapterStage: campaignLevelChapterStageLabel(level),
    missionTitle: campaignLevelDisplayTitle(level),
  };
}

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
