import type { LevelDefinition, LevelDefinitionStored, MapLayout } from './types';

/** 外置地圖 JSON：`mapLayout` 必填，`mapTheme` 可選（極短戰場名，建議 ≤5 字） */
export type MapFilePayload = { mapLayout: MapLayout; mapTheme?: string };

/** @deprecated 請用 MapFilePayload */
export type MapLayoutFilePayload = MapFilePayload;

export function hydrateLevelDefinitions(
  levels: LevelDefinitionStored[],
  resolveMapFile: (mapRef: string) => MapFilePayload
): LevelDefinition[] {
  return levels.map((entry) => {
    const { mapRef, mapLayout: inline, mapTheme: storedTheme, ...rest } = entry;
    if (inline != null) {
      const theme = storedTheme != null && String(storedTheme).trim() !== '' ? String(storedTheme).trim() : undefined;
      return {
        ...(rest as Omit<LevelDefinition, 'mapLayout' | 'mapTheme'>),
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
      return {
        ...(rest as Omit<LevelDefinition, 'mapLayout' | 'mapTheme'>),
        mapLayout: bundle.mapLayout,
        ...(theme != null ? { mapTheme: theme } : {}),
      };
    }
    throw new Error(`關卡 ${entry.levelId} 缺少 mapLayout，且未設定有效 mapRef`);
  });
}
