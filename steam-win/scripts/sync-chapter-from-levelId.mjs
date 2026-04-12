/**
 * 依 levelId 對齊 chapter：第 N 關 => 第 ceil(N/10) 章（1～100 => 1～10 章）。
 * 只改 chapter 欄位，不動 initialSeed（避免盤面種子變動）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const levelsPath = path.join(root, 'renderer/src/levelData/levels.json');

const raw = fs.readFileSync(levelsPath, 'utf8');
const j = JSON.parse(raw);
const levels = j.levels;
if (!Array.isArray(levels)) {
  console.error('levels.json: missing levels array');
  process.exit(1);
}

const changes = [];
for (const lv of levels) {
  if (typeof lv.levelId !== 'number') continue;
  const want = Math.min(10, Math.max(1, Math.ceil(lv.levelId / 10)));
  if (lv.chapter !== want) {
    changes.push({ levelId: lv.levelId, from: lv.chapter, to: want });
    lv.chapter = want;
  }
}

fs.writeFileSync(levelsPath, `${JSON.stringify(j, null, 2)}\n`);
console.log(`sync-chapter-from-levelId: wrote ${changes.length} chapter fix(es)`);
for (const c of changes) console.log(`  L${c.levelId}: chapter ${c.from} -> ${c.to}`);
