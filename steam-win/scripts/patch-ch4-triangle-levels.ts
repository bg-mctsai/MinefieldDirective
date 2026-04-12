/**
 * 可重跑：第 4 章 31～50 關 `mapLayout` 與 `buildCh4TriangleMapLayout` 同步
 *（31～32 完整三角；33+ 種子隨機 forbidden 地形）。
 * 寫入 maps 時會保留既有 `mapTheme`（見 `lib/levelMapFiles.ts`）。
 * 若要以企劃剪影覆蓋三角地圖，請改跑 `node scripts/gen-chapter4-maps.mjs`（僅 31～40）。
 * 執行：npx tsx scripts/patch-ch4-triangle-levels.ts（cwd = steam-win）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildCh4TriangleMapLayout } from '../renderer/src/levelData/ch4MapLayout.ts';
import type { MapLayout } from '../renderer/src/levelData/types';
import { LEVELS_JSON_PATH, setMapLayoutOnLevel } from './lib/levelMapFiles.ts';

type LevelRow = {
  levelId: number;
  gridSystem: string;
  initialSeed: string;
  mapLayout?: MapLayout;
  mapRef?: string;
};

const raw = JSON.parse(readFileSync(LEVELS_JSON_PATH, 'utf8')) as { levels: LevelRow[] };

for (const L of raw.levels) {
  if (L.levelId < 31 || L.levelId > 50) continue;
  if (L.gridSystem !== 'TRIANGLE') continue;
  const next = buildCh4TriangleMapLayout(L.levelId, L.initialSeed);
  setMapLayoutOnLevel(L, next);
}

writeFileSync(LEVELS_JSON_PATH, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
console.log('Patched 31–50 mapLayout: L31–32 full grid; L33+ seeded terrain (forbiddenCells).');
