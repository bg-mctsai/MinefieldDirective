/**
 * 52～100：initialSeed 加隨機後綴 + 依種子產生 forbiddenCells（方／三角／六角）。
 * 炸點、必雷、加秒目標、prePlaced 座標不會被設為禁格。
 * 執行：node scripts/apply-random-terrain-l52-up.mjs（cwd = steam-win）
 */
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const levelsPath = join(__dirname, '../renderer/src/levelData/levels.json');
const mapsDir = join(__dirname, '../renderer/src/levelData/maps');
const MIN_ID = 52;
const MAX_ID = 100;

function getMapLayout(L) {
  if (L.mapLayout != null) return L.mapLayout;
  if (L.mapRef == null || L.mapRef === '') throw new Error(`關卡 ${L.levelId} 缺 mapLayout / mapRef`);
  const p = join(mapsDir, `${L.mapRef}.json`);
  return JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, '')).mapLayout;
}

function setMapLayout(L, mapLayout) {
  if (L.mapRef != null && L.mapRef !== '') {
    if (!existsSync(mapsDir)) mkdirSync(mapsDir, { recursive: true });
    writeFileSync(join(mapsDir, `${L.mapRef}.json`), `${JSON.stringify({ mapLayout }, null, 2)}\n`, 'utf8');
  } else {
    L.mapLayout = mapLayout;
  }
}

function hashSeed(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function protectedCellKeys(L) {
  const s = new Set();
  for (const bp of L.blastPoints ?? []) {
    const [x, y] = bp.pos;
    s.add(`${x},${y}`);
  }
  for (const c of L.forcedMineCells ?? []) {
    s.add(`${c[0]},${c[1]}`);
  }
  for (const c of L.mineBonusTargetCells ?? []) {
    s.add(`${c[0]},${c[1]}`);
  }
  const ml = getMapLayout(L);
  if (ml.type === 'SQUARE' && ml.prePlaced) {
    for (const pr of ml.prePlaced) {
      s.add(`${pr.pos[0]},${pr.pos[1]}`);
    }
  }
  return s;
}

function shufflePickCoords(seed, width, height, count, protectedKeys) {
  const roll = mulberry32(hashSeed(seed));
  const coords = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = `${x},${y}`;
      if (protectedKeys.has(k)) continue;
      coords.push([x, y]);
    }
  }
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(roll() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }
  const n = Math.min(count, coords.length);
  return coords.slice(0, n);
}

const j = JSON.parse(readFileSync(levelsPath, 'utf8').replace(/^\uFEFF/, ''));

for (const L of j.levels) {
  if (L.levelId < MIN_ID || L.levelId > MAX_ID) continue;

  const ch = L.chapter;
  const suf = randomBytes(4).toString('hex');
  L.initialSeed = `minefield-campaign-v1-L${L.levelId}-ch${ch}-${suf}`;
  const seed = L.initialSeed;
  const prot = protectedCellKeys(L);
  const ml = getMapLayout(L);

  if (ml.type === 'SQUARE') {
    const { width: w, height: h } = ml;
    const area = w * h;
    const rollN = mulberry32(hashSeed(`${seed}-sq-forbid-n`))();
    const frac = 0.04 + rollN * 0.08;
    let n = Math.floor(area * frac);
    const maxF = Math.max(4, Math.floor(area * 0.16));
    n = Math.min(Math.max(n, 4), maxF);
    const fc = shufflePickCoords(`${seed}-sq-cells`, w, h, n, prot);
    setMapLayout(L, {
      type: 'SQUARE',
      width: w,
      height: h,
      ...(ml.prePlaced ? { prePlaced: ml.prePlaced } : {}),
      forbiddenCells: fc,
    });
  } else if (ml.type === 'TRIANGLE' || ml.type === 'HEXAGON') {
    const { width: w, height: h } = ml.placeholder;
    const area = w * h;
    const tag = ml.type === 'HEXAGON' ? 'hex' : 'tri';
    const rollN = mulberry32(hashSeed(`${seed}-${tag}-terrain-n`))();
    const frac = 0.12 + rollN * 0.14;
    let n = Math.floor(area * frac);
    const maxF = Math.max(6, Math.floor(area * 0.32));
    n = Math.min(Math.max(n, 6), maxF);
    const fc = shufflePickCoords(`${seed}-${tag}-terrain-cells`, w, h, n, prot);
    if (ml.type === 'TRIANGLE') {
      setMapLayout(L, { type: 'TRIANGLE', placeholder: { width: w, height: h }, forbiddenCells: fc });
    } else {
      setMapLayout(L, { type: 'HEXAGON', placeholder: { width: w, height: h }, forbiddenCells: fc });
    }
  }
}

writeFileSync(levelsPath, `${JSON.stringify(j, null, 2)}\n`, 'utf8');
console.log(`terrain + seeds: levels ${MIN_ID}–${MAX_ID}`);
