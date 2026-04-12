/**
 * 讀取 levels.json（與外置 maps/*.json），驗證 100 關後寫回並更新頂層 `_企劃欄位說明`。
 * 執行：npm run export-levels-json（專案根目錄 steam-win）
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hydrateLevelDefinitions } from '../renderer/src/levelData/hydrateLevelMaps.ts';
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

function resolveMapLayoutFromDisk(mapRef: string) {
  const p = join(mapsDir, `${mapRef}.json`);
  if (!existsSync(p)) {
    throw new Error(`缺少地圖檔：maps/${mapRef}.json`);
  }
  const raw = JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, '')) as { mapLayout?: unknown };
  if (raw?.mapLayout == null) {
    throw new Error(`maps/${mapRef}.json 缺少 mapLayout`);
  }
  return raw.mapLayout as LevelDefinition['mapLayout'];
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
  }
}

if (!existsSync(outPath)) {
  throw new Error(`找不到 ${outPath}；請從版本庫還原 levels.json。`);
}

const rawText = readFileSync(outPath, 'utf8').replace(/^\uFEFF/, '');
const raw = JSON.parse(rawText);
const stored = parseLevelsJson(raw);
const levels = hydrateLevelDefinitions(stored, resolveMapLayoutFromDisk);
validateLevels(levels);

const payload = { _企劃欄位說明: PLANNER_FIELD_DOCS, levels: stored };
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Validated & wrote ${stored.length} levels + planner docs -> ${outPath}`);
