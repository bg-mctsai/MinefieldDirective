/**
 * 同關多個 blastPoints：countdownSec 兩兩至少相差 5 秒。
 * node scripts/patch-blast-countdown-gap.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEVELS_PATH = path.resolve(__dirname, '../renderer/src/levelData/levels.json');

const MIN_GAP = 5;
/** 同關多炸點時，最短 countdownSec 下限 */
const FLOOR = 15;

/** 依現有倒數由高到低排序後，重新分配 anchor, anchor-5, …（最短 ≥ FLOOR） */
export function spreadBlastCountdowns(blastPoints, minGap = MIN_GAP) {
  if (!blastPoints || blastPoints.length <= 1) return false;
  const n = blastPoints.length;
  const anchor = Math.max(
    ...blastPoints.map((bp) => bp.countdownSec),
    FLOOR + minGap * (n - 1),
  );

  const indexed = blastPoints.map((bp, i) => ({ bp, i, cd: bp.countdownSec }));
  indexed.sort((a, b) => b.cd - a.cd || a.i - b.i);
  let changed = false;
  indexed.forEach((item, rank) => {
    const next = anchor - rank * minGap;
    if (item.bp.countdownSec !== next) {
      item.bp.countdownSec = next;
      changed = true;
    }
  });
  return changed;
}

export function validateBlastCountdownGap(blastPoints, minGap = MIN_GAP) {
  if (!blastPoints || blastPoints.length <= 1) return [];
  const cds = blastPoints.map((bp) => bp.countdownSec);
  const issues = [];
  for (let i = 0; i < cds.length; i++) {
    for (let j = i + 1; j < cds.length; j++) {
      if (Math.abs(cds[i] - cds[j]) < minGap) {
        issues.push({ a: cds[i], b: cds[j] });
      }
    }
  }
  return issues;
}

const doc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));
let patched = 0;

for (const lv of doc.levels) {
  const bps = lv.blastPoints;
  if (!bps || bps.length <= 1) continue;
  const before = bps.map((bp) => bp.countdownSec).join(',');
  if (spreadBlastCountdowns(bps)) {
    const after = bps.map((bp) => bp.countdownSec).join(',');
    console.log(`L${lv.levelId} ${lv.mapRef ?? ''}: [${before}] → [${after}]`);
    patched++;
  }
}

fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`patched ${patched} level(s)`);

let errors = 0;
for (const lv of doc.levels) {
  const issues = validateBlastCountdownGap(lv.blastPoints);
  if (issues.length) {
    console.error(`L${lv.levelId}: still invalid`, issues);
    errors++;
  }
}
process.exit(errors > 0 ? 1 : 0);
