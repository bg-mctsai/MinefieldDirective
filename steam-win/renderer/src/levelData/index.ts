import type { LevelDefinition } from './types';
import levelDefinitionsJson from './levels.json';

export * from './types';
export { buildPlayableLevel, type PlayableLevel } from './buildRuntimeLevel';
export { createLevelDefinition } from './levelDefinitionsFactory';
export { PLANNER_FIELD_DOCS } from './plannerFieldDocs';

type LevelsJsonRoot = {
  _企劃欄位說明?: Record<string, string>;
  levels: LevelDefinition[];
};

function parseLevelsJson(raw: unknown): LevelDefinition[] {
  if (Array.isArray(raw)) return raw as LevelDefinition[];
  const root = raw as LevelsJsonRoot;
  if (root?.levels && Array.isArray(root.levels)) return root.levels;
  throw new Error('levels.json 格式錯誤：需為 { levels: [...] } 或關卡陣列');
}

/** 100 關資料來源：`levels.json` 的 `levels`（頂層 `_企劃欄位說明` 僅供企劃閱讀） */
export const LEVEL_DEFINITIONS: LevelDefinition[] = parseLevelsJson(levelDefinitionsJson);
