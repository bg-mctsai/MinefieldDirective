import { LEVELS_PER_CHAPTER } from '../game/chapterStage';

import type { LevelDefinition } from './types';
import chapterEntryBriefingsJson from './chapterEntryBriefings.json';

type BriefingSplit = {
  chapterTone?: string[];
  levelBriefing?: string[];
};

type ChapterEntryBriefingsFile = {
  byLevelId: Record<string, string[] | BriefingSplit>;
};

const TABLE = (chapterEntryBriefingsJson as ChapterEntryBriefingsFile).byLevelId;

function normalizeBriefingEntry(
  entry: string[] | BriefingSplit | undefined,
  fallbackLevelBriefing: string[] | undefined,
): BriefingSplit {
  if (Array.isArray(entry)) return { levelBriefing: entry };
  if (entry) return entry;
  return { levelBriefing: fallbackLevelBriefing };
}

function chapterFirstLevelId(chapter: number): number {
  return (chapter - 1) * LEVELS_PER_CHAPTER + 1;
}

function shouldUseChapterFallback(level: LevelDefinition): boolean {
  return level.levelEntryBriefingFallbackToChapterStart ?? true;
}

/**
 * 章首回退只應套在「該章第一關」：byLevelId 僅在 11/21/31… 等鍵放章進場台詞時，
 * 不可讓同章其餘關因預設 fallback 而每關都吃到同一段簡報。
 */
function chapterStartBriefingFallbackEntry(level: LevelDefinition): string[] | BriefingSplit | undefined {
  if (!shouldUseChapterFallback(level)) return undefined;
  const firstId = chapterFirstLevelId(level.chapter);
  if (level.levelId !== firstId) return undefined;
  return TABLE[String(firstId)];
}

/**
 * 將集中設定的「長官簡報」依 levelId 合併進關卡定義。
 * 新版支援拆成 chapterTone / levelBriefing；舊版字串陣列仍視為 levelBriefing 相容。
 */
export function mergeChapterEntryBriefingsIntoDefinitions(levels: LevelDefinition[]): LevelDefinition[] {
  return levels.map((level) => {
    if (level.entryBriefingEnabled === false) {
      const { chapterEntryTone: _omitTone, levelEntryBriefing: _omitBrief, chapterEntryBriefing: _omit, ...rest } = level;
      return rest as LevelDefinition;
    }

    const exact = TABLE[String(level.levelId)];
    const chapterFallback = chapterStartBriefingFallbackEntry(level);
    const normalized = normalizeBriefingEntry(
      exact ?? chapterFallback,
      level.chapterEntryBriefing,
    );

    const chapterTone = normalized.chapterTone?.length ? normalized.chapterTone : undefined;
    const levelBriefing = normalized.levelBriefing?.length
      ? normalized.levelBriefing
      : level.chapterEntryBriefing?.length
        ? level.chapterEntryBriefing
        : undefined;

    if (chapterTone || levelBriefing) {
      return {
        ...level,
        chapterEntryTone: chapterTone,
        levelEntryBriefing: levelBriefing,
      };
    }
    const { chapterEntryTone: _omitTone, levelEntryBriefing: _omitBrief, chapterEntryBriefing: _omit, ...rest } = level;
    return rest as LevelDefinition;
  });
}
