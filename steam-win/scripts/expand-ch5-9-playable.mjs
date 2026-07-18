/**
 * 第 5～9 章：比照 ch4 標準——每關 playable 至少 +10、剪影保持各異；
 * 重放 digitOutposts／mineBonusTargetCells／blastPoints／forcedMineCells，
 * 並依公式重算 timeLimit。
 *
 * 執行（cwd = steam-win）：node scripts/expand-ch5-9-playable.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenFromPlayable, key } from './lib/campaignSilhouettes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');
const LEVELS_PATH = path.resolve(__dirname, '../renderer/src/levelData/levels.json');

const MIN_DELTA = 10;
const NEIGH8 = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function bounds(mapLayout) {
  if (mapLayout.type === 'SQUARE') return { W: mapLayout.width, H: mapLayout.height };
  if (mapLayout.type === 'HEXAGON' || mapLayout.type === 'TRIANGLE') {
    return { W: mapLayout.placeholder.width, H: mapLayout.placeholder.height };
  }
  return null;
}

function playableSet(mapLayout) {
  const b = bounds(mapLayout);
  if (!b) return null;
  const { W, H } = b;
  const forb = new Set((mapLayout.forbiddenCells ?? []).map((c) => key(c[0], c[1])));
  const play = new Set();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!forb.has(key(x, y))) play.add(key(x, y));
    }
  }
  return { W, H, play };
}

function parseKey(k) {
  const [x, y] = k.split(',').map(Number);
  return [x, y];
}

function frontierCandidates(W, H, play) {
  const out = [];
  for (const k of play) {
    const [x, y] = parseKey(k);
    for (const [dx, dy] of NEIGH8) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const nk = key(nx, ny);
      if (!play.has(nk)) out.push(nk);
    }
  }
  return [...new Set(out)];
}

function padBoard(W, H, play, padLeft, padTop, padRight, padBottom) {
  const nW = W + padLeft + padRight;
  const nH = H + padTop + padBottom;
  const nPlay = new Set();
  for (const k of play) {
    const [x, y] = parseKey(k);
    nPlay.add(key(x + padLeft, y + padTop));
  }
  return { W: nW, H: nH, play: nPlay };
}

/** 依 mapRef 打散選邊，避免同形地圖膨脹後仍撞形 */
function expandPlayable(mapRef, mapLayout, minDelta) {
  const ps = playableSet(mapLayout);
  if (!ps) throw new Error(`${mapRef}: unsupported map type ${mapLayout.type}`);
  let { W, H, play } = ps;
  const oldN = play.size;
  const target = oldN + minDelta;
  const seed = hashStr(mapRef);
  let guard = 0;

  while (play.size < target) {
    guard++;
    if (guard > 5000) throw new Error(`${mapRef}: expand loop`);

    let frontier = frontierCandidates(W, H, play);
    if (frontier.length === 0) {
      // 依 seed 決定往哪邊 pad，讓各關膨脹方向不同
      const side = seed % 4;
      if (side === 0) ({ W, H, play } = padBoard(W, H, play, 1, 0, 0, 0));
      else if (side === 1) ({ W, H, play } = padBoard(W, H, play, 0, 1, 0, 0));
      else if (side === 2) ({ W, H, play } = padBoard(W, H, play, 0, 0, 1, 0));
      else ({ W, H, play } = padBoard(W, H, play, 0, 0, 0, 1));
      // pad 後先把新邊角鄰接格納入 frontier 下一輪
      continue;
    }

    frontier.sort((a, b) => {
      const ha = hashStr(`${mapRef}:${a}`);
      const hb = hashStr(`${mapRef}:${b}`);
      return ha - hb || a.localeCompare(b);
    });

    const need = target - play.size;
    const take = Math.min(need, frontier.length);
    for (let i = 0; i < take; i++) play.add(frontier[i]);
  }

  return { W, H, play, oldN, newN: play.size };
}

function geomSignature(W, H, play) {
  const bits = [];
  for (let y = 0; y < H; y++) {
    let row = '';
    for (let x = 0; x < W; x++) row += play.has(key(x, y)) ? '#' : '.';
    bits.push(row);
  }
  return `${W}x${H}|${bits.join('/')}`;
}

function loadAllGeomSigs(skipRefs) {
  const map = new Map();
  for (const f of fs.readdirSync(MAPS_DIR)) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    const ref = f.replace(/\.json$/, '');
    if (skipRefs.has(ref)) continue;
    const doc = readJson(path.join(MAPS_DIR, f));
    if (!doc.mapLayout) continue;
    const ps = playableSet(doc.mapLayout);
    if (!ps) continue;
    const { W, H, play } = ps;
    const sig = geomSignature(W, H, play);
    if (!map.has(sig)) map.set(sig, []);
    map.get(sig).push(ref);
  }
  return map;
}

function nearestPlayable(play, [x, y], avoid) {
  const self = key(x, y);
  if (play.has(self) && !avoid.has(self)) return [x, y];
  let best = null;
  let bestD = Infinity;
  for (const k of play) {
    if (avoid.has(k)) continue;
    const [px, py] = parseKey(k);
    const d = (px - x) ** 2 + (py - y) ** 2;
    if (d < bestD || (d === bestD && k < (best ? key(best[0], best[1]) : ''))) {
      bestD = d;
      best = [px, py];
    }
  }
  if (!best) throw new Error('no playable cell available');
  return best;
}

function remapCells(play, cells, avoidInit = []) {
  const avoid = new Set(avoidInit.map((c) => key(c[0], c[1])));
  const out = [];
  for (const c of cells) {
    const pos = nearestPlayable(play, c, avoid);
    out.push(pos);
    avoid.add(key(pos[0], pos[1]));
  }
  return { cells: out, avoid };
}

function timeLimitFor(chapter, mapRef, playableCells) {
  if (chapter === 5) {
    const slot = Number(String(mapRef).split('_')[1]);
    return slot <= 5 ? playableCells : playableCells - 5;
  }
  if (chapter >= 6 && chapter <= 9) return playableCells - 15;
  throw new Error(`unexpected chapter ${chapter}`);
}

function maxWeightDigit(weights) {
  return Math.max(...Object.keys(weights ?? {}).map(Number));
}

const levelsDoc = readJson(LEVELS_PATH);
const targets = levelsDoc.levels.filter((l) => l.chapter >= 5 && l.chapter <= 9);
const skipRefs = new Set(targets.map((l) => l.mapRef));
const geomSigs = loadAllGeomSigs(skipRefs);

const report = [];
const conflicts = [];

for (const lv of targets) {
  const mapPath = path.join(MAPS_DIR, `${lv.mapRef}.json`);
  const mapDoc = readJson(mapPath);
  const type = mapDoc.mapLayout.type;

  let { W, H, play, oldN } = expandPlayable(lv.mapRef, mapDoc.mapLayout, MIN_DELTA);

  // 若與其他關幾何撞形，再多膨幾格直到唯一
  let uniqGuard = 0;
  while (geomSigs.has(geomSignature(W, H, play))) {
    uniqGuard++;
    if (uniqGuard > 40) {
      conflicts.push(
        `${lv.mapRef}: cannot uniquify geometry vs ${geomSigs.get(geomSignature(W, H, play))}`,
      );
      break;
    }
    const layout =
      type === 'SQUARE'
        ? { type: 'SQUARE', width: W, height: H, forbiddenCells: forbiddenFromPlayable(W, H, play) }
        : {
            type: 'HEXAGON',
            placeholder: { width: W, height: H },
            forbiddenCells: forbiddenFromPlayable(W, H, play),
          };
    const more = expandPlayable(`${lv.mapRef}#u${uniqGuard}`, layout, 2);
    ({ W, H, play } = more);
  }

  const sig = geomSignature(W, H, play);
  if (geomSigs.has(sig)) {
    // already logged
  } else {
    geomSigs.set(sig, [lv.mapRef]);
  }

  const forbidden = forbiddenFromPlayable(W, H, play);
  mapDoc.mapLayout =
    type === 'SQUARE'
      ? { type: 'SQUARE', width: W, height: H, forbiddenCells: forbidden }
      : { type: 'HEXAGON', placeholder: { width: W, height: H }, forbiddenCells: forbidden };
  mapDoc.gridStats = {
    totalCells: W * H,
    forbiddenCellCount: forbidden.length,
    playableCells: play.size,
  };
  writeJson(mapPath, mapDoc);

  // --- remap features（互不重疊）---
  let avoid = new Set();
  const featNotes = [];

  if (Array.isArray(lv.digitOutposts) && lv.digitOutposts.length) {
    const { cells, avoid: a } = remapCells(play, lv.digitOutposts, []);
    lv.digitOutposts = cells;
    avoid = a;
    featNotes.push(`outposts=${cells.length}`);
  }

  if (Array.isArray(lv.mineBonusTargetCells) && lv.mineBonusTargetCells.length) {
    const prev = [...avoid].map(parseKey);
    const { cells, avoid: a } = remapCells(play, lv.mineBonusTargetCells, prev);
    lv.mineBonusTargetCells = cells;
    avoid = a;
    featNotes.push(`mineBonus=${cells.length}`);
  }

  if (Array.isArray(lv.blastPoints) && lv.blastPoints.length) {
    const prev = [...avoid].map(parseKey);
    const oldPos = lv.blastPoints.map((b) => b.pos);
    const { cells, avoid: a } = remapCells(play, oldPos, prev);
    lv.blastPoints = lv.blastPoints.map((b, i) => ({ ...b, pos: cells[i] }));
    avoid = a;
    featNotes.push(`blast=${cells.length}`);
  }

  if (Array.isArray(lv.forcedMineCells) && lv.forcedMineCells.length) {
    const prev = [...avoid].map(parseKey);
    const { cells } = remapCells(play, lv.forcedMineCells, prev);
    lv.forcedMineCells = cells;
    featNotes.push(`forcedMine=${cells.length}`);
  }

  // 特色旗標保留（僅座標重放，不改機制開關）
  const flags = [
    lv.dynamicMinePerMove && 'dynMine',
    lv.commandSlotReceiveJamming && 'jamming',
    lv.neighborPlacedDigitBonus && 'neighborBonus',
  ].filter(Boolean);
  if (flags.length) featNotes.push(flags.join('+'));

  // weights vs grid
  const maxD = maxWeightDigit(lv.commands?.weights);
  if (type === 'HEXAGON' && maxD > 6) {
    conflicts.push(`${lv.mapRef}: HEXAGON but weights max digit ${maxD}`);
  }
  if (type === 'SQUARE' && maxD > 8) {
    conflicts.push(`${lv.mapRef}: SQUARE but weights max digit ${maxD}`);
  }

  // 特色座標合法性與互斥
  const used = new Map(); // key -> feature name
  const claim = (label, cells) => {
    for (const c of cells ?? []) {
      const k = key(c[0], c[1]);
      if (!play.has(k)) conflicts.push(`${lv.mapRef}: ${label} ${k} not playable`);
      if (used.has(k)) conflicts.push(`${lv.mapRef}: ${label} overlaps ${used.get(k)} at ${k}`);
      used.set(k, label);
    }
  };
  claim('digitOutposts', lv.digitOutposts);
  claim('mineBonusTargetCells', lv.mineBonusTargetCells);
  claim(
    'blastPoints',
    (lv.blastPoints ?? []).map((b) => b.pos),
  );
  claim('forcedMineCells', lv.forcedMineCells);

  const oldTime = lv.timeLimit;
  lv.timeLimit = timeLimitFor(lv.chapter, lv.mapRef, play.size);

  report.push({
    mapRef: lv.mapRef,
    type,
    oldN,
    newN: play.size,
    delta: play.size - oldN,
    oldTime,
    newTime: lv.timeLimit,
    theme: mapDoc.mapTheme,
    feats: featNotes.join(',') || '(none)',
  });
}

writeJson(LEVELS_PATH, levelsDoc);

console.log('mapRef | type | playable | Δ | timeLimit | theme | features');
for (const r of report) {
  console.log(
    `${r.mapRef} | ${r.type} | ${r.oldN}→${r.newN} | +${r.delta} | ${r.oldTime}→${r.newTime} | ${r.theme} | ${r.feats}`,
  );
}

if (conflicts.length) {
  console.error('\nCONFLICTS:');
  for (const c of conflicts) console.error(' -', c);
  process.exit(1);
}

console.log(`\nexpanded ${report.length} levels (ch5～9).`);
