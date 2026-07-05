/**
 * 第九章全方格後，同步 levels.json：timeLimit = playable − 20、六角關改方格 weights。
 * 執行（cwd = steam-win）：node scripts/patch-ch9-square-levels.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAPS_DIR = path.resolve(__dirname, '../renderer/src/levelData/maps');
const LEVELS_PATH = path.resolve(__dirname, '../renderer/src/levelData/levels.json');

const SQUARE_WEIGHTS_STD = { '1': 8, '2': 14, '3': 22, '4': 22, '5': 14, '6': 10, '7': 7, '8': 3 };
const SQUARE_WEIGHTS_ALT = { '1': 10, '2': 14, '3': 18, '4': 18, '5': 14, '6': 10, '7': 8, '8': 4 };

/** 9_8 保留低數字池；其餘依關卡序交替 */
const WEIGHTS_BY_MAP = {
  '9_1': SQUARE_WEIGHTS_ALT,
  '9_2': SQUARE_WEIGHTS_STD,
  '9_3': SQUARE_WEIGHTS_ALT,
  '9_4': SQUARE_WEIGHTS_ALT,
  '9_5': SQUARE_WEIGHTS_STD,
  '9_6': SQUARE_WEIGHTS_STD,
  '9_7': SQUARE_WEIGHTS_ALT,
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function playableFromMapRef(mapRef) {
  const doc = readJson(path.join(MAPS_DIR, `${mapRef}.json`));
  return doc.gridStats?.playableCells ?? 0;
}

const doc = readJson(LEVELS_PATH);

for (const lv of doc.levels) {
  if (lv.chapter !== 9) continue;
  const mapRef = lv.mapRef;
  const playable = playableFromMapRef(mapRef);
  const newTime = playable - 20;
  const weights = WEIGHTS_BY_MAP[mapRef];

  if (lv.timeLimit !== newTime) {
    console.log(`${mapRef} timeLimit ${lv.timeLimit} -> ${newTime}`);
    lv.timeLimit = newTime;
  }
  if (weights) {
    const cur = JSON.stringify(lv.commands?.weights ?? {});
    const next = JSON.stringify(weights);
    if (cur !== next) {
      console.log(`${mapRef} commands.weights updated`);
      lv.commands = { maxHand: 3, poolType: 'WEIGHTED', weights: { ...weights } };
    }
  } else if (mapRef === '9_8') {
    console.log(`${mapRef} keep restricted weights 1–3`);
  }
}

const ch9doc = doc._企劃欄位說明;
if (ch9doc) {
  ch9doc['commands.chapter9'] =
    '第 9 章鄰焰共振（chapter=9）：全章 SQUARE，commands 為 \"1\"～\"8\"（9_8 例外僅 \"1\"～\"3\"）；timeLimit = playableCells − 20。';
}

writeJson(LEVELS_PATH, doc);
console.log('levels.json chapter 9 synced');
