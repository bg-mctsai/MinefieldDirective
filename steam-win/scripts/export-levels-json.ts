/**
 * 依 levelDefinitionsFactory 邏輯輸出 100 關 JSON。
 * 執行：npm run export-levels-json（專案根目錄 steam-win）
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLevelDefinition } from '../renderer/src/levelData/levelDefinitionsFactory.ts';
import { PLANNER_FIELD_DOCS } from '../renderer/src/levelData/plannerFieldDocs.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../renderer/src/levelData/levels.json');

const levels = Array.from({ length: 100 }, (_, i) => createLevelDefinition(i + 1));
const payload = { _企劃欄位說明: PLANNER_FIELD_DOCS, levels };
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${levels.length} levels + planner docs -> ${outPath}`);
