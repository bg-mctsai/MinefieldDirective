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
  return (chapter - 1) * 10 + 1;
}

function shouldUseChapterFallback(level: LevelDefinition): boolean {
  return level.levelEntryBriefingFallbackToChapterStart ?? true;
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
    const chapterFallback = shouldUseChapterFallback(level)
      ? TABLE[String(chapterFirstLevelId(level.chapter))]
      : undefined;
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
