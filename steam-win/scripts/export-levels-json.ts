/**
 * 讀取 levels.json（與外置 maps/*.json），驗證 100 關後寫回並更新頂層 `_企劃欄位說明`。
 * 執行：npm run export-levels-json（專案根目錄 steam-win）
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hydrateLevelDefinitions, type MapFilePayload } from '../renderer/src/levelData/hydrateLevelMaps.ts';
import { PLANNER_FIELD_DOCS } from '../renderer/src/levelData/plannerFieldDocs.ts';
import type { LevelDefinition, LevelDefinitionStored } from '../renderer/src/levelData/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../renderer/src/levelData/levels.json');
const mapsDir = join(__dirname, '../renderer/src/levelData/maps');

type LevelsJsonRoot = {
  _企劃欄位說明?: Record<string, string>;
  levels: LevelDefinitionStored[];
};

function parseLevelsJson(raw: unknown): LevelDefinitionStored[] {
  if (Array.isArray(raw)) return raw as LevelDefinitionStored[];
  const root = raw as LevelsJsonRoot;
  if (root?.levels && Array.isArray(root.levels)) return root.levels;
  throw new Error('levels.json 格式錯誤：需為 { levels: [...] } 或關卡陣列');
}

function resolveMapFileFromDisk(mapRef: string): MapFilePayload {
  const p = join(mapsDir, `${mapRef}.json`);
  if (!existsSync(p)) {
    throw new Error(`缺少地圖檔：maps/${mapRef}.json`);
  }
  const raw = JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, '')) as {
    mapLayout?: unknown;
    mapTheme?: unknown;
  };
  if (raw?.mapLayout == null) {
    throw new Error(`maps/${mapRef}.json 缺少 mapLayout`);
  }
  const theme =
    typeof raw.mapTheme === 'string' && raw.mapTheme.trim() !== '' ? raw.mapTheme.trim() : undefined;
  return { mapLayout: raw.mapLayout as LevelDefinition['mapLayout'], mapTheme: theme };
}

/** 企劃上限：第 9 章盤面外框總格數（方格 w×h；三角／六角為 placeholder 矩形）不得超過 300 */
function layoutCellBudget(ml: LevelDefinition['mapLayout']): number {
  switch (ml.type) {
    case 'SQUARE':
    case 'CROSS':
      return ml.width * ml.height;
    case 'HEXAGON':
      return ml.placeholder.width * ml.placeholder.height;
    case 'DIAMOND':
      return (ml.radius * 2 + 1) * (ml.radius * 2 + 1);
    case 'MIXED':
      return ml.sectors.reduce((sum, sec) => sum + sec.size[0] * sec.size[1], 0);
    default: {
      const _exhaustive: never = ml;
      return _exhaustive;
    }
  }
}

function validateLevels(levels: LevelDefinition[]): void {
  if (levels.length !== 100) {
    throw new Error(`levels 須恰為 100 筆，目前為 ${levels.length}`);
  }
  const seen = new Set<number>();
  for (const l of levels) {
    const id = l.levelId;
    if (typeof id !== 'number' || id < 1 || id > 100) {
      throw new Error(`無效 levelId: ${String(id)}`);
    }
    if (seen.has(id)) throw new Error(`重複 levelId: ${id}`);
    seen.add(id);
  }
  for (let n = 1; n <= 100; n++) {
    if (!seen.has(n)) throw new Error(`缺少 levelId: ${n}`);
  }
  for (const l of levels) {
    const expectedChapter = Math.min(10, Math.max(1, Math.ceil(l.levelId / 10)));
    if (l.chapter !== expectedChapter) {
      throw new Error(
        `levelId ${l.levelId}：chapter 須為 ${expectedChapter}（第 1～10 章各對應關卡 10n−9～10n），目前為 ${l.chapter}`
      );
    }
    if (typeof l.timeLimit !== 'number' || l.timeLimit <= 0) {
      throw new Error(`levelId ${l.levelId}：timeLimit 須為正整數（全關計時），目前為 ${String(l.timeLimit)}`);
    }
    if ((l.events?.length ?? 0) > 0) {
      throw new Error(`levelId ${l.levelId}：events 尚未實裝，請保持空陣列 []`);
    }
    if (l.chapter === 9) {
      const cells = layoutCellBudget(l.mapLayout);
      if (cells > 300) {
        throw new Error(
          `levelId ${l.levelId}（第9章）：地圖外框總格數為 ${cells}，超過企劃上限 300（請縮小 width/height 或 placeholder）`,
        );
      }
    }
  }
}

if (!existsSync(outPath)) {
  throw new Error(`找不到 ${outPath}；請從版本庫還原 levels.json。`);
}

const rawText = readFileSync(outPath, 'utf8').replace(/^\uFEFF/, '');
const raw = JSON.parse(rawText);
const stored = parseLevelsJson(raw);
const levels = hydrateLevelDefinitions(stored, resolveMapFileFromDisk);
validateLevels(levels);

const payload = { _企劃欄位說明: PLANNER_FIELD_DOCS, levels: stored };
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Validated & wrote ${stored.length} levels + planner docs -> ${outPath}`);
