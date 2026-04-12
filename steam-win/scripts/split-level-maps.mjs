/**
 * 一次性：把 levels.json 內每關的 mapLayout 抽到 levelData/maps/{levelId}.json，
 * 關卡內改為 mapRef（字串，通常等於 levelId）。
 * 執行：node scripts/split-level-maps.mjs（cwd = steam-win）
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEVELS_JSON_PATH = join(__dirname, '../renderer/src/levelData/levels.json');
const MAPS_DIR = join(__dirname, '../renderer/src/levelData/maps');

const raw = JSON.parse(readFileSync(LEVELS_JSON_PATH, 'utf8').replace(/^\uFEFF/, ''));
if (!raw.levels || !Array.isArray(raw.levels)) {
  throw new Error('levels.json 需含 levels 陣列');
}

if (!existsSync(MAPS_DIR)) mkdirSync(MAPS_DIR, { recursive: true });

for (const L of raw.levels) {
  if (L.mapRef != null && L.mapLayout == null) {
    console.log(`關卡 ${L.levelId} 已為外置地圖（mapRef=${L.mapRef}），略過`);
    continue;
  }
  if (L.mapLayout == null) {
    throw new Error(`關卡 ${L.levelId} 無 mapLayout 可抽出`);
  }
  const ref = String(L.levelId);
  const mapPath = join(MAPS_DIR, `${ref}.json`);
  writeFileSync(mapPath, `${JSON.stringify({ mapLayout: L.mapLayout }, null, 2)}\n`, 'utf8');
  delete L.mapLayout;
  L.mapRef = ref;
}

writeFileSync(LEVELS_JSON_PATH, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
console.log(`已寫入 ${MAPS_DIR} 並更新 ${LEVELS_JSON_PATH}`);
