/**
 * 一次性遷移：將 levels.json 的 mapRef 與 maps/*.json 改為「章節_關卡」
 * （與 hydrateLevelMaps.resolveChapterStageLevelKey 一致）。
 * 執行：node scripts/migrate-map-files-to-chapter-stage.mjs（cwd: steam-win）
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEVELS_PATH = join(__dirname, '../renderer/src/levelData/levels.json');
const MAPS_DIR = join(__dirname, '../renderer/src/levelData/maps');

function resolveChapterStageLevelKey(entry, stageCounterByChapter) {
  const chapter =
    typeof entry.chapter === 'number' && Number.isFinite(entry.chapter) ? Math.floor(entry.chapter) : 1;
  const nextStage = (stageCounterByChapter.get(chapter) ?? 0) + 1;
  stageCounterByChapter.set(chapter, nextStage);
  const stage =
    typeof entry.stage === 'number' && Number.isFinite(entry.stage) && entry.stage >= 1
      ? Math.floor(entry.stage)
      : nextStage;
  return { chapter, stage, levelKey: `${chapter}_${stage}` };
}

const raw = readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, '');
const root = JSON.parse(raw);
const levels = root.levels;
if (!Array.isArray(levels)) throw new Error('levels.json 缺少 levels 陣列');

const counter = new Map();
for (const L of levels) {
  const { levelKey } = resolveChapterStageLevelKey(L, counter);
  const oldRef = L.mapRef;
  if (oldRef == null || oldRef === '') continue;
  if (oldRef === levelKey) continue;

  const src = join(MAPS_DIR, `${oldRef}.json`);
  const dst = join(MAPS_DIR, `${levelKey}.json`);
  if (!existsSync(src)) throw new Error(`找不到 ${src}（levelId=${L.levelId} mapRef=${oldRef}）`);
  if (existsSync(dst)) throw new Error(`目標已存在，停止：${dst}（避免覆寫）`);
  renameSync(src, dst);
  L.mapRef = levelKey;
}

writeFileSync(LEVELS_PATH, `${JSON.stringify(root, null, 2)}\n`, 'utf8');
console.log('OK: mapRef 與 maps 已改為 章節_關卡.json');
