/**
 * 讀取現有 levels.json，驗證 100 關後寫回並更新頂層 `_企劃欄位說明`。
 * 關卡內容以 JSON 為單一真相來源，不再從程式產生。
 * 執行：npm run export-levels-json（專案根目錄 steam-win）
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLANNER_FIELD_DOCS } from '../renderer/src/levelData/plannerFieldDocs.ts';
import type { LevelDefinition } from '../renderer/src/levelData/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../renderer/src/levelData/levels.json');

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
}

if (!existsSync(outPath)) {
  throw new Error(`找不到 ${outPath}；請從版本庫還原 levels.json。`);
}

const raw = JSON.parse(readFileSync(outPath, 'utf8'));
const levels = parseLevelsJson(raw);
validateLevels(levels);
levels.sort((a, b) => a.levelId - b.levelId);

const payload = { _企劃欄位說明: PLANNER_FIELD_DOCS, levels };
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Validated & wrote ${levels.length} levels + planner docs -> ${outPath}`);
