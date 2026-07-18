/**
 * 第 4 章 maps/4_1～4_8：重寫 HEXAGON 剪影（八關各異）+ mapTheme + gridStats。
 * 並同步 levels.json 的 timeLimit（4_1～4_2=playable；4_3～4_8=playable−5）
 * 與 4_5～4_8 的 digitOutposts（落在可部署格）。
 *
 * 執行（cwd = steam-win）：node scripts/gen-chapter4-hex-maps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forbiddenFromPlayable, key } from './lib/campaignSilhouettes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');
const LEVELS_PATH = path.resolve(__dirname, '../renderer/src/levelData/levels.json');

/**
 * 八關獨立剪影；目標 playable ≥ 舊值 +10
 * 舊：50,57,75,76,72,82,86,72 → 新：≥60,67,85,86,82,92,96,82
 */
const CH4_SHAPES = [
  {
    mapRef: '4_1',
    theme: '蜂格初陣',
    // 全板教學：11×6 = 66
    rows: [
      '###########',
      '###########',
      '###########',
      '###########',
      '###########',
      '###########',
    ],
  },
  {
    mapRef: '4_2',
    theme: '巢面展開',
    // 上下寬、中間窄的展開巢面
    rows: [
      '.#########.',
      '###########',
      '.#########.',
      '..#######..',
      '..#######..',
      '.#########.',
      '###########',
      '.#########.',
    ],
  },
  {
    mapRef: '4_3',
    theme: '蜂巢戰斧',
    // 斧頭加厚、柄加寬
    rows: [
      '....######....',
      '..##########..',
      '.############.',
      '##############',
      '##############',
      '.############.',
      '....####......',
      '....####......',
      '....####......',
      '....######....',
      '....######....',
      '....######....',
    ],
  },
  {
    mapRef: '4_4',
    theme: '六角蝴蝶',
    rows: [
      '###........###',
      '#####....#####',
      '######..######',
      '.############.',
      '..##########..',
      '..##########..',
      '.############.',
      '######..######',
      '#####....#####',
      '###........###',
    ],
  },
  {
    mapRef: '4_5',
    theme: '閃電折線',
    rows: [
      '..##########',
      '..##########',
      '..######....',
      '..######....',
      '..##########',
      '..##########',
      '....######..',
      '....######..',
      '##########..',
      '##########..',
      '######......',
      '######......',
    ],
  },
  {
    mapRef: '4_6',
    theme: '蜂巢盾牌',
    rows: [
      '.###########.',
      '#############',
      '#############',
      '#############',
      '.###########.',
      '..#########..',
      '..#########..',
      '...#######...',
      '...#######...',
      '....#####....',
      '....#####....',
      '.....###.....',
      '......#......',
    ],
  },
  {
    mapRef: '4_7',
    theme: '骷髏陣地',
    rows: [
      '..#########..',
      '.###########.',
      '#############',
      '###..###..###',
      '###..###..###',
      '#############',
      '.###########.',
      '..#########..',
      '..##.#.#.##..',
      '..#.#####.#..',
      '...#.#.#.#...',
      '.....###.....',
      '......#......',
    ],
  },
  {
    mapRef: '4_8',
    theme: '祕鑰巢穴',
    rows: [
      '...########...',
      '..##########..',
      '.#####..#####.',
      '.#####..#####.',
      '..##########..',
      '...########...',
      '....######....',
      '....######....',
      '...########...',
      '....######....',
      '...########...',
      '....######....',
      '...########...',
    ],
  },
];

const MIN_PLAYABLE = [60, 67, 85, 86, 82, 92, 96, 82];
const OLD_PLAYABLE = [50, 57, 75, 76, 72, 82, 86, 72];

function rowsToPlayable(rows) {
  const H = rows.length;
  const W = rows[0].length;
  for (const r of rows) {
    if (r.length !== W) throw new Error(`row width mismatch: ${r.length} vs ${W}`);
  }
  const playable = new Set();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rows[y][x] === '#') playable.add(key(x, y));
    }
  }
  return { W, H, playable };
}

function playableList(mapLayout) {
  const forbidden = new Set((mapLayout.forbiddenCells ?? []).map((c) => key(c[0], c[1])));
  const { width: W, height: H } = mapLayout.placeholder;
  const cells = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!forbidden.has(key(x, y))) cells.push([x, y]);
    }
  }
  return cells;
}

/** 據點：分散取頂／中／底／側邊可部署格 */
function pickOutposts(cells, n) {
  if (cells.length < n) throw new Error(`need ${n} playable cells, got ${cells.length}`);
  const ys = cells.map((c) => c[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const midY = (minY + maxY) / 2;
  const scoreBuckets = [
    (c) => -c[1], // top
    (c) => Math.abs(c[1] - midY) + Math.abs(c[0] - 5) * 0.01, // mid
    (c) => c[1], // bottom
    (c) => c[0] + Math.abs(c[1] - midY) * 0.01, // leftish
  ];
  const picked = [];
  const used = new Set();
  for (let i = 0; i < n; i++) {
    const score = scoreBuckets[i % scoreBuckets.length];
    const cand = cells
      .filter((c) => !used.has(key(c[0], c[1])))
      .map((c) => ({ c, s: score(c) }))
      .sort((a, b) => a.s - b.s);
    const best = cand[0].c;
    picked.push(best);
    used.add(key(best[0], best[1]));
  }
  return picked;
}

const playableByRef = {};

for (let i = 0; i < CH4_SHAPES.length; i++) {
  const shape = CH4_SHAPES[i];
  const { W, H, playable } = rowsToPlayable(shape.rows);
  const playableCells = playable.size;
  if (playableCells < MIN_PLAYABLE[i]) {
    throw new Error(
      `${shape.mapRef}: playable ${playableCells} < min ${MIN_PLAYABLE[i]} (old ${OLD_PLAYABLE[i]}+10)`,
    );
  }
  const forbiddenCells = forbiddenFromPlayable(W, H, playable);
  const json = {
    mapLayout: {
      type: 'HEXAGON',
      placeholder: { width: W, height: H },
      forbiddenCells,
    },
    mapTheme: shape.theme,
    gridStats: {
      totalCells: W * H,
      forbiddenCellCount: forbiddenCells.length,
      playableCells,
    },
  };
  fs.writeFileSync(path.join(MAPS_DIR, `${shape.mapRef}.json`), `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  playableByRef[shape.mapRef] = { playableCells, mapLayout: json.mapLayout };
  const delta = playableCells - OLD_PLAYABLE[i];
  console.log(
    `${shape.mapRef}: ${W}×${H} playable=${playableCells} (+${delta}) theme=${shape.theme}`,
  );
}

const levelsDoc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));

for (const lv of levelsDoc.levels) {
  if (lv.chapter !== 4) continue;
  const info = playableByRef[lv.mapRef];
  if (!info) throw new Error(`missing map for ${lv.mapRef}`);
  const pc = info.playableCells;
  // 4_1～4_2：1:1；4_3～4_8：playable−5
  const slot = Number(String(lv.mapRef).split('_')[1]);
  lv.timeLimit = slot <= 2 ? pc : pc - 5;

  if (slot >= 5 && slot <= 8) {
    const cells = playableList(info.mapLayout);
    lv.digitOutposts = pickOutposts(cells, 4);
  } else {
    delete lv.digitOutposts;
  }
}

fs.writeFileSync(LEVELS_PATH, `${JSON.stringify(levelsDoc, null, 2)}\n`, 'utf8');

console.log('\n已更新 maps/4_1～4_8.json 與 levels.json（timeLimit / digitOutposts）。');
