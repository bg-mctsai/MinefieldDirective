/**
 * 可重跑：第 4 章 31～50 關 `mapLayout` 與 `buildCh4TriangleMapLayout` 同步
 *（31～32 完整三角；33+ 種子隨機 forbidden 地形）。
 * 執行：npx tsx scripts/patch-ch4-triangle-levels.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCh4TriangleMapLayout } from '../renderer/src/levelData/ch4MapLayout.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, '../renderer/src/levelData/levels.json');

const raw = JSON.parse(readFileSync(path, 'utf8')) as { levels: { levelId: number; gridSystem: string; initialSeed: string; mapLayout: unknown }[] };

for (const L of raw.levels) {
  if (L.levelId < 31 || L.levelId > 50) continue;
  if (L.gridSystem !== 'TRIANGLE') continue;
  L.mapLayout = buildCh4TriangleMapLayout(L.levelId, L.initialSeed);
}

writeFileSync(path, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
console.log('Patched 31–50 mapLayout: L31–32 full grid; L33+ seeded terrain (forbiddenCells).');
