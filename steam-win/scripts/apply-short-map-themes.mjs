/**
 * 將 levelData/maps/{id}.json 的 mapTheme 改為極短顯示用名（對局頂欄「… · 第 N 關-xxx」）。
 * 字數交錯：關卡 id 循環 5→2→3→4 字（各 25 關）。
 * 執行：node scripts/apply-short-map-themes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mapsDir = path.resolve(__dirname, '../renderer/src/levelData/maps');

/** 依關卡 1～100 順序；第 i 關字數 = [5,2,3,4][(i-1)%4] */
const THEMES_ORDERED = [
  '新兵訓練',
  '長條',
  '橫展區',
  '穩定節奏',
  '長廊掃描道',
  '寬道',
  '主練場',
  '加深演練',
  '終段加長區',
  '章操',
  '工字梁',
  '鑰匙孔型',
  '外框閃電溝',
  '雙柱',
  '雙層框',
  '坦克側影',
  '粗十旋翼帶',
  '八角',
  '三叉口',
  '同心方環',
  '雙堤前哨谷',
  '幹線',
  '折線谷',
  '四角斷層',
  'H型塹壕道',
  '雙峰',
  '三叉谷',
  '乾谷五穴',
  '折閃曼幹線',
  '終溝',
  '鑲嵌場',
  '熟手擴面',
  '閃電溝雷達',
  '工谷',
  '鑰匙孔',
  '粗十分水',
  '窄峽縱谷區',
  '雙堤',
  '鑽石面',
  '章末方環',
  '蜂巢初鳴台',
  '熟成',
  '雷溝線',
  '工字窄腰',
  '觀測前哨脊',
  '匯流',
  '掃頻巷',
  '干擾翼堤',
  '雙翼干擾堤',
  '共振',
  '蜂巢面',
  '相位滿一',
  '相位移二號',
  '溝閃',
  '樑谷區',
  '鑰孔狹隘',
  '十字分水隘',
  '縱掃',
  '雙橫堤',
  '鑽石切面',
  '方環終曲場',
  '干甲',
  '干擾乙',
  '閃電折返',
  '工承窄腰區',
  '鑰滿',
  '熱十字',
  '縱峽深槽',
  '雙橫相位帶',
  '邊帶',
  '餘韻盤',
  '引爆單核',
  '雙雷狹峰線',
  '壓折',
  '工炸區',
  '鑰孔三炸',
  '縱峽夾擊掃',
  '熱十',
  '強波堤',
  '章末鑽邊',
  '八章終戰盤',
  '外環',
  '鄰工區',
  '蜂巢鄰鑰',
  '大十熱芯盤',
  '縱峽',
  '六雙堤',
  '鄰焰深鑽',
  '三角方環巢',
  '六閃',
  '終焰盤',
  '終焉對角',
  '三角雙工峽',
  '鑰芯',
  '廢雷場',
  '干擾槽掃',
  '鄰焰三橫堤',
  '邊炸',
  '鑽石邊',
  '終章盤炸',
  '神之眼監視',
];

const SHORT_BY_LEVEL = Object.fromEntries(THEMES_ORDERED.map((s, i) => [i + 1, s]));

function assertLen(s, id) {
  const n = [...s].length;
  if (n < 2 || n > 5) throw new Error(`Level ${id}: mapTheme「${s}」須 2～5 字，目前 ${n}`);
  const expect = [5, 2, 3, 4][(id - 1) % 4];
  if (n !== expect) throw new Error(`Level ${id}: 預期 ${expect} 字、實際 ${n} 字：「${s}」`);
}

let updated = 0;
for (let id = 1; id <= 100; id += 1) {
  const next = SHORT_BY_LEVEL[id];
  if (!next) throw new Error(`Missing theme for level ${id}`);
  assertLen(next, id);
  const fp = path.join(mapsDir, `${id}.json`);
  const raw = fs.readFileSync(fp, 'utf8');
  const data = JSON.parse(raw);
  if (typeof data.mapTheme !== 'string') throw new Error(`${id}.json: 無 mapTheme 字串`);
  if (data.mapTheme === next) continue;
  data.mapTheme = next;
  fs.writeFileSync(fp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  updated += 1;
}
console.log(`mapTheme 已寫入 1～100 關（5/2/3/4 字交錯）；實際變更 ${updated} 個檔案。`);
