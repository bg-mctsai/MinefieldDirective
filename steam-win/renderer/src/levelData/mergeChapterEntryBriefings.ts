import type { LevelDefinition } from './types';
import chapterEntryBriefingsJson from './chapterEntryBriefings.json';

type ChapterEntryBriefingsFile = {
  byLevelId: Record<string, string[]>;
};

const TABLE = (chapterEntryBriefingsJson as ChapterEntryBriefingsFile).byLevelId;

/**
 * 將集中設定的「長官簡報」依 levelId 合併進關卡定義（執行時欄位 chapterEntryBriefing）。
 * 集中表有該關且陣列非空時優先；否則保留 JSON 內可選的 chapterEntryBriefing（開發重載舊檔相容）。
 */
export function mergeChapterEntryBriefingsIntoDefinitions(levels: LevelDefinition[]): LevelDefinition[] {
  return levels.map((level) => {
    const fromTable = TABLE[String(level.levelId)];
    const lines =
      fromTable != null && fromTable.length > 0 ? fromTable : level.chapterEntryBriefing;
    if (lines != null && lines.length > 0) {
      return { ...level, chapterEntryBriefing: lines };
    }
    const { chapterEntryBriefing: _omit, ...rest } = level;
    return rest as LevelDefinition;
  });
}
