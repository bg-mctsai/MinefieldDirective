import type { GridSystem, LevelDefinition, LevelDefinitionStored, MapLayout } from './types';

/** 由地圖幾何推導鄰接／UI 用 gridSystem（與 mapLayout.type 對齊；CROSS／DIAMOND 視同 SQUARE）。 */
export function inferGridSystemFromMapLayout(layout: MapLayout): GridSystem {
  switch (layout.type) {
    case 'HEXAGON':
      return 'HEXAGON';
    case 'MIXED':
      return 'MIXED';
    case 'SQUARE':
    case 'CROSS':
    case 'DIAMOND':
      return 'SQUARE';
  }
}

/** 企劃標註用（可選）：矩形為 width×height；DIAMOND／合併區以實際可玩格計 totalCells。 */
export type MapGridStats = {
  totalCells: number;
  forbiddenCellCount: number;
  playableCells: number;
};

/** 外置地圖 JSON：`mapLayout` 必填，`mapTheme` 可選（極短戰場名，建議 ≤5 字），`gridStats` 可選（盤面格數摘要） */
export type MapFilePayload = { mapLayout: MapLayout; mapTheme?: string; gridStats?: MapGridStats };

/** @deprecated 請用 MapFilePayload */
export type MapLayoutFilePayload = MapFilePayload;

/**
 * 與執行期 `levelKey` 相同：依章節內順序遞增 stage（除非該筆明確填 `stage`）。
 * 外置地圖檔名與 `mapRef` 建議使用此字串，例如 `3_2` → `maps/3_2.json`。
 */
export function resolveChapterStageLevelKey(
  entry: Pick<LevelDefinitionStored, 'chapter' | 'stage'>,
  stageCounterByChapter: Map<number, number>
): { chapter: number; stage: number; levelKey: string } {
  const chapter =
    typeof entry.chapter === 'number' && Number.isFinite(entry.chapter) ? Math.floor(entry.chapter) : 1;
  const nextStage = (stageCounterByChapter.get(chapter) ?? 0) + 1;
  stageCounterByChapter.set(chapter, nextStage);
  const stage =
    typeof entry.stage === 'number' && Number.isFinite(entry.stage) && entry.stage >= 1
      ? Math.floor(entry.stage)
      : nextStage;
  return { chapter, stage, levelKey: `${chapter}_${stage}` };
}

export function hydrateLevelDefinitions(
  levels: LevelDefinitionStored[],
  resolveMapFile: (mapRef: string) => MapFilePayload
): LevelDefinition[] {
  const stageCounterByChapter = new Map<number, number>();

  return levels.map((entry) => {
    const { chapter, stage, levelKey } = resolveChapterStageLevelKey(entry, stageCounterByChapter);

    const { mapRef, mapLayout: inline, mapTheme: storedTheme, gridSystem: gridOverride, ...rest } = entry;
    if (inline != null) {
      const theme = storedTheme != null && String(storedTheme).trim() !== '' ? String(storedTheme).trim() : undefined;
      const gridSystem = gridOverride ?? inferGridSystemFromMapLayout(inline);
      return {
        ...(rest as Omit<LevelDefinition, 'mapLayout' | 'mapTheme' | 'gridSystem'>),
        gridSystem,
        chapter,
        stage,
        levelKey,
        mapLayout: inline,
        ...(theme != null ? { mapTheme: theme } : {}),
      };
    }
    if (mapRef != null && mapRef !== '') {
      const bundle = resolveMapFile(mapRef);
      const theme =
        bundle.mapTheme != null && String(bundle.mapTheme).trim() !== ''
          ? String(bundle.mapTheme).trim()
          : storedTheme != null && String(storedTheme).trim() !== ''
            ? String(storedTheme).trim()
            : undefined;
      const gridSystem = gridOverride ?? inferGridSystemFromMapLayout(bundle.mapLayout);
      return {
        ...(rest as Omit<LevelDefinition, 'mapLayout' | 'mapTheme' | 'gridSystem'>),
        gridSystem,
        chapter,
        stage,
        levelKey,
        mapLayout: bundle.mapLayout,
        ...(theme != null ? { mapTheme: theme } : {}),
      };
    }
    throw new Error(`關卡 ${entry.levelId} 缺少 mapLayout，且未設定有效 mapRef`);
  });
}
