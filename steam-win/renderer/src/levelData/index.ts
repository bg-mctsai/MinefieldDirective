import type { LevelDefinition, LevelDefinitionStored } from './types';
import levelDefinitionsJson from './levels.json';
import { hydrateLevelDefinitions, type MapFilePayload, type MapLayoutFilePayload } from './hydrateLevelMaps';
import { mergeChapterEntryBriefingsIntoDefinitions } from './mergeChapterEntryBriefings';

export * from './types';
export { buildPlayableLevel, type PlayableLevel } from './buildRuntimeLevel';
export { buildCh4HexMapLayout, buildCh4TriangleMapLayout } from './ch4MapLayout';
export { PLANNER_FIELD_DOCS } from './plannerFieldDocs';
export { hydrateLevelDefinitions, type MapFilePayload, type MapLayoutFilePayload } from './hydrateLevelMaps';

type LevelsJsonRoot = {
  _企劃欄位說明?: Record<string, string>;
  levels: LevelDefinitionStored[];
};

const mapLayoutModules = import.meta.glob<{ default: MapLayoutFilePayload }>('./maps/*.json', {
  eager: true,
});

function mapFileFromBundledGlob(mapRef: string): MapFilePayload {
  const key = `./maps/${mapRef}.json`;
  const mod = mapLayoutModules[key]?.default;
  if (mod?.mapLayout == null) {
    throw new Error(`找不到已打包的地圖：maps/${mapRef}.json（請確認檔案存在且鍵名與 mapRef 一致）`);
  }
  const theme =
    typeof mod.mapTheme === 'string' && mod.mapTheme.trim() !== '' ? mod.mapTheme.trim() : undefined;
  return { mapLayout: mod.mapLayout, mapTheme: theme };
}

/** 解析 JSON 根物件為「存檔用」關卡列（mapLayout 可缺省、改由 mapRef 外置檔補上） */
export function parseLevelsJsonStored(raw: unknown): LevelDefinitionStored[] {
  if (Array.isArray(raw)) return raw as LevelDefinitionStored[];
  const root = raw as LevelsJsonRoot;
  if (root?.levels && Array.isArray(root.levels)) return root.levels;
  throw new Error('levels.json 格式錯誤：需為 { levels: [...] } 或關卡陣列');
}

function finalizeLevelDefinitions(levels: LevelDefinition[]): LevelDefinition[] {
  return mergeChapterEntryBriefingsIntoDefinitions(levels);
}

export function parseLevelsJson(raw: unknown): LevelDefinition[] {
  return finalizeLevelDefinitions(hydrateLevelDefinitions(parseLevelsJsonStored(raw), mapFileFromBundledGlob));
}

/** 100 關：`levels.json` + `maps/*.json` 合併後之關卡定義；開發時可由 `applyReloadedLevelDefinitionsJson` 替換 */
export let LEVEL_DEFINITIONS: LevelDefinition[] = parseLevelsJson(levelDefinitionsJson);

/**
 * 開發用：以新 JSON 替換記憶體中的關卡定義（須再呼叫 `rebuildPlayableLevelsFromDefinitions`）。
 * 若關卡使用 `mapRef`，請傳入 `mapFilesByRef`（由重載流程 fetch 各 `maps/{ref}.json` 的 `mapLayout` 與可選 `mapTheme`）。
 */
export function applyReloadedLevelDefinitionsJson(
  raw: unknown,
  mapFilesByRef?: Record<string, MapFilePayload>
): void {
  const stored = parseLevelsJsonStored(raw);
  const resolve =
    mapFilesByRef != null
      ? (ref: string) => {
          const bundle = mapFilesByRef[ref];
          if (bundle?.mapLayout == null) {
            throw new Error(`重載關卡資料時缺少 mapRef「${ref}」對應的 mapLayout`);
          }
          return bundle;
        }
      : mapFileFromBundledGlob;
  LEVEL_DEFINITIONS = finalizeLevelDefinitions(hydrateLevelDefinitions(stored, resolve));
}
