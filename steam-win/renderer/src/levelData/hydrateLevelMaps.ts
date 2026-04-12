import type { LevelDefinition, LevelDefinitionStored, MapLayout } from './types';

export type MapLayoutFilePayload = { mapLayout: MapLayout };

export function hydrateLevelDefinitions(
  levels: LevelDefinitionStored[],
  resolveMapLayout: (mapRef: string) => MapLayout
): LevelDefinition[] {
  return levels.map((entry) => {
    const { mapRef, mapLayout: inline, ...rest } = entry;
    const mapLayout =
      inline != null ? inline : mapRef != null && mapRef !== '' ? resolveMapLayout(mapRef) : undefined;
    if (mapLayout == null) {
      throw new Error(`關卡 ${entry.levelId} 缺少 mapLayout，且未設定有效 mapRef`);
    }
    return { ...(rest as Omit<LevelDefinition, 'mapLayout'>), mapLayout };
  });
}
