/**
 * 前 4 關：僅本章核心機制；後 4 關：本章核心 + 累積混和（第 1～N-1 章）。
 * node scripts/patch-chapter-front4-back4-mechanics.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LEVELS_PATH = path.join(ROOT, 'renderer/src/levelData/levels.json');
const MAPS_DIR = path.join(ROOT, 'renderer/src/levelData/maps');

const key = (x, y) => `${x},${y}`;

function loadMap(mapRef) {
  const p = path.join(MAPS_DIR, `${mapRef}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function playableSet(mapLayout) {
  const s = new Set();
  const forbidden = new Set((mapLayout.forbiddenCells ?? []).map((c) => key(c[0], c[1])));
  if (mapLayout.type === 'SQUARE') {
    for (let y = 0; y < mapLayout.height; y++) {
      for (let x = 0; x < mapLayout.width; x++) {
        if (!forbidden.has(key(x, y))) s.add(key(x, y));
      }
    }
  } else if (mapLayout.type === 'HEXAGON') {
    const ph = mapLayout.placeholder;
    for (let y = 0; y < ph.height; y++) {
      for (let x = 0; x < ph.width; x++) {
        if (!forbidden.has(key(x, y))) s.add(key(x, y));
      }
    }
  }
  return s;
}

function pickPlayable(mapRef, avoidKeys, preferCenter = true) {
  const map = loadMap(mapRef);
  if (!map?.mapLayout) return [0, 0];
  const play = playableSet(map.mapLayout);
  const avoid = new Set(avoidKeys.map((c) => key(c[0], c[1])));
  const candidates = [...play]
    .filter((k) => !avoid.has(k))
    .map((k) => {
      const [x, y] = k.split(',').map(Number);
      const ph = map.mapLayout.placeholder ?? map.mapLayout;
      const cx = (ph.width ?? map.mapLayout.width) / 2;
      const cy = (ph.height ?? map.mapLayout.height) / 2;
      const dist = preferCenter ? (x - cx) ** 2 + (y - cy) ** 2 : Math.random();
      return { pos: [x, y], dist };
    })
    .sort((a, b) => a.dist - b.dist);
  return candidates[0]?.pos ?? [0, 0];
}

function pickNPlayable(mapRef, n, avoidKeys = []) {
  const picked = [];
  const avoid = [...avoidKeys];
  for (let i = 0; i < n; i++) {
    const p = pickPlayable(mapRef, avoid, i % 2 === 0);
    picked.push(p);
    avoid.push(p);
  }
  return picked;
}

const CMD_FULL = {
  maxHand: 3,
  poolType: 'WEIGHTED',
  weights: { 1: 8, 2: 14, 3: 22, 4: 22, 5: 14, 6: 10, 7: 7, 8: 3 },
};
const CMD_HEX = {
  maxHand: 3,
  poolType: 'WEIGHTED',
  weights: { 1: 18, 2: 22, 3: 20, 4: 18, 5: 12, 6: 8 },
};
const CMD_JAM_SQ = {
  maxHand: 3,
  poolType: 'RANDOM',
  weights: { 1: 8, 2: 14, 3: 22, 4: 22, 5: 14, 6: 10, 7: 7, 8: 3 },
};
const CMD_JAM_HEX = {
  maxHand: 3,
  poolType: 'RANDOM',
  weights: { 1: 18, 2: 22, 3: 20, 4: 18, 5: 12, 6: 10 },
};

function blastOne(mapRef, countdownSec, defuseBonusSec, avoid = []) {
  const pos = pickPlayable(mapRef, avoid);
  return [{ pos, countdownSec, defuseBonusSec }];
}

function blastTwo(mapRef, specs, sharedAvoid = []) {
  const out = [];
  const avoid = [...sharedAvoid];
  for (const s of specs) {
    const pos = pickPlayable(mapRef, avoid);
    out.push({ pos, countdownSec: s.countdownSec, defuseBonusSec: s.defuseBonusSec });
    avoid.push(pos);
  }
  return out;
}

function mineBonus(mapRef, n, seconds = 5, avoid = []) {
  return {
    mineBonusTargetCells: pickNPlayable(mapRef, n, avoid),
    mineBonusSeconds: seconds,
  };
}

function outposts(mapRef, n, avoid = []) {
  return { digitOutposts: pickNPlayable(mapRef, n, avoid) };
}

const doc = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8').replace(/^\uFEFF/, ''));
const byId = new Map(doc.levels.map((lv) => [lv.levelId, lv]));

function lv(id) {
  return byId.get(id);
}

function apply(id, patch) {
  Object.assign(lv(id), patch);
}

// ── 第 2 章後段：混 ch1 全指令池 ──
for (const id of [13, 14, 15, 16]) {
  apply(id, { commands: CMD_FULL });
}

// ── 第 3 章後段：混 ch2 破碎地形（換 2_x 地圖）+ 保留據點 ──
const ch3backMaps = [
  { id: 21, mapRef: '2_5', outpostN: 4 },
  { id: 22, mapRef: '2_6', outpostN: 4 },
  { id: 23, mapRef: '2_7', outpostN: 5 },
  { id: 24, mapRef: '2_8', outpostN: 6 },
];
const ch3backPlayable = { 21: 132, 22: 94, 23: 117, 24: 105 };
for (const { id, mapRef, outpostN } of ch3backMaps) {
  const ops = pickNPlayable(mapRef, outpostN);
  apply(id, { mapRef, digitOutposts: ops, timeLimit: ch3backPlayable[id] });
}

// ── 第 4 章前段：移除過早據點 ──
for (const id of [27, 28]) {
  const level = lv(id);
  delete level.digitOutposts;
  apply(id, { coverageGoal: 0.74, timeLimit: id === 27 ? 70 : 71 });
}

// ── 第 5 章前段：純通訊節點 ──
apply(35, {
  mineBonusTargetCells: [
    [8, 7],
    [2, 3],
  ],
  mineBonusSeconds: 5,
});
delete lv(35).digitOutposts;

delete lv(36).digitOutposts;

// ── 第 6 章後段：混 ch3 據點 + ch5 通訊節點 ──
{
  const mb45 = mineBonus('6_5', 1, 5);
  apply(45, { ...mb45, ...outposts('6_5', 2, mb45.mineBonusTargetCells) });
}
apply(46, { ...outposts('6_6', 2) });
{
  const mb47 = mineBonus('6_7', 2, 4);
  apply(47, { ...mb47, ...outposts('6_7', 2, mb47.mineBonusTargetCells) });
}
{
  const mb48 = mineBonus('6_8', 2, 5);
  apply(48, { ...mb48, ...outposts('6_8', 3, mb48.mineBonusTargetCells) });
}

// ── 第 7 章後段：漸進混 ch6 廢雷 + ch5 通訊 + ch3 據點 ──
apply(53, { dynamicMinePerMove: true });
{
  const ops54 = lv(54).digitOutposts ?? [];
  const mb54 = mineBonus('7_6', 1, 4, ops54);
  apply(54, { ...mb54 });
}
{
  const avoid55 = [...(lv(55).digitOutposts ?? [])];
  const mb55 = mineBonus('7_7', 1, 4, avoid55);
  apply(55, { ...mb55 });
}
{
  const avoid56 = [...(lv(56).digitOutposts ?? [])];
  const mb56 = mineBonus('7_8', 2, 5, avoid56);
  apply(56, { ...mb56 });
}

// ── 第 8 章後段：混 ch7 干擾 + ch6 廢雷 + ch3 據點 ──
apply(61, {
  commandSlotReceiveJamming: true,
  commandSlotJammingStepMs: 300,
});
apply(62, { dynamicMinePerMove: true });
apply(63, {
  commandSlotReceiveJamming: true,
  commandSlotJammingStepMs: 280,
  ...outposts('8_7', 2),
});
apply(64, {
  commandSlotReceiveJamming: true,
  commandSlotJammingStepMs: 260,
  dynamicMinePerMove: true,
  ...outposts('8_8', 2),
});

// ── 第 9 章後段：混 ch8 炸點 + ch7 干擾 + ch6 廢雷 + ch3 據點 ──
apply(69, {
  blastPoints: blastTwo('9_5', [
    { countdownSec: 28, defuseBonusSec: 10 },
    { countdownSec: 23, defuseBonusSec: 8 },
  ]),
});
apply(70, {
  commandSlotReceiveJamming: true,
  commandSlotJammingStepMs: 300,
});
apply(71, {
  dynamicMinePerMove: true,
  ...outposts('9_7', 2),
});
apply(72, {
  commandSlotReceiveJamming: true,
  commandSlotJammingStepMs: 280,
  blastPoints: blastOne('9_8', 25, 8),
});

// ── 第 10 章：前段輕複合（2～3 機制）、後段全混 + 通訊節點 ──
delete lv(73).digitOutposts;
delete lv(74).digitOutposts;
delete lv(75).digitOutposts;
{
  const mb75 = mineBonus('10_3', 1, 6);
  apply(75, { ...mb75 });
}
delete lv(76).digitOutposts;
{
  const mb77 = mineBonus('10_5', 1, 5);
  apply(77, { ...mb77 });
}
// 10_6～10_8 後段保留據點並補通訊節點
{
  const mb79 = mineBonus('10_7', 1, 5, lv(79).digitOutposts ?? []);
  apply(79, {
    commandSlotReceiveJamming: true,
    commandSlotJammingStepMs: 240,
    ...mb79,
  });
}
{
  const mb80 = mineBonus('10_8', 2, 5, lv(80).digitOutposts ?? []);
  apply(80, {
    neighborPlacedDigitBonus: true,
    ...mb80,
  });
}

// ── 企劃說明 ──
doc._企劃欄位說明['chapterProgression.front4back4'] =
  '每章 8 關：x_1～x_4 僅本章核心機制（強度遞增）；x_5～x_8 本章核心 + 第 1～(N-1) 章機制漸進混和。全戰役計時與覆蓋率為底層，不算特色機制。';
doc._企劃欄位說明['digitOutposts.chapter4'] =
  '第 4 章：4_1～4_4 純六角教學（無據點）；4_5～4_8 混 ch3 據點（各 3～4 據點）。';
doc._企劃欄位說明['mineBonusTargetCells.chapter5'] =
  '第 5 章斷線封鎖：5_1～5_4 僅 mineBonusTargetCells（通訊恢復節點，1→1→2→2）；5_5 起混 ch3 據點與 ch4 六角。勿與 digitOutposts 重疊。';

fs.writeFileSync(LEVELS_PATH, JSON.stringify(doc, null, 2) + '\n', 'utf8');
console.log('Patched levels.json — front4/back4 mechanics');
