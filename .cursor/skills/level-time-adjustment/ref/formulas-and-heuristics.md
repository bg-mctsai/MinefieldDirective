# TimeLimit 公式與估算

## 第 1～2 章：依可玩格的固定偏移（專案約定）

「格子數」指外置地圖 `steam-win/renderer/src/levelData/maps/{mapRef}.json` 內 `gridStats.playableCells`（與 `totalCells − forbiddenCellCount` 一致）。改 `mapLayout`／`forbiddenCells` 後若需重算摘要，可執行 repo 內 `node scripts/patch-map-grid-stats.mjs`。

| 範圍 | `mapRef` | `levelId` | `timeLimit` |
|------|----------|-----------|-------------|
| 第一章（節選） | `1_3`～`1_8` | 3～8 | **`playableCells + 5`** |
| 第二章 | `2_1`～`2_8` | 9～16 | **`playableCells + 2`** |

**未套用本表者**：`1_1`、`1_2`（levelId 1、2）維持 `levels.json` 手調秒數，不強制符合上式。

套用時同步編輯 `steam-win/renderer/src/levelData/levels.json` 對應筆的 `timeLimit`（正整數）。

## 第 3～5 章：timeLimit（專案約定）

| 範圍 | `mapRef` | `levelId` | `timeLimit` |
|------|----------|-----------|-------------|
| 第三章 | `3_1`～`3_8` | 17～24 | **`playableCells`**（1:1） |
| 第四章 蜂巢戰線 | `4_1`～`4_2` | 25～26 | **`playableCells`**（1:1） |
| 第四章 蜂巢戰線 | `4_3`～`4_8` | 27～32 | **`playableCells − 5`** |
| 第五章 斷線封鎖 方格 | `5_1`～`5_5` | 33～37 | **`playableCells`**（1:1） |
| 第五章 斷線封鎖 六角 | `5_6`～`5_8` | 38～40 | **`playableCells − 5`** |

改動地圖後請以 `maps/{mapRef}.json` 的 `gridStats.playableCells` 為準更新 `levels.json`。

## 第 6～10 章：可玩格減 15 秒（專案約定）

| 範圍 | `mapRef` | `levelId`（現行戰役） | `timeLimit` |
|------|----------|----------------------|-------------|
| 第六～十章 | `6_1`～`10_8` | 41～80 | **`playableCells − 15`** |

- 相對第 3～5 章 1:1 公式，後段戰役整體再緊 **15 秒**；仍完全由地圖 `playableCells` 驅動，不手填脫鉤秒數。
- 改 `mapLayout`／`forbiddenCells` 後先跑 `node scripts/patch-map-grid-stats.mjs`，再重算本表。
- 現行 `playableCells` 區間約 **72～117** → `timeLimit` 約 **57～102**（例：`6_1` 78→63、`10_8` 117→102）。

### 批次重算（第 6 章起）

於 repo 根目錄執行（會覆寫 `levels.json` 內 `chapter >= 6` 各筆 `timeLimit`）：

```bash
node -e "
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const levelsPath = path.join(root, 'steam-win/renderer/src/levelData/levels.json');
const mapsDir = path.join(root, 'steam-win/renderer/src/levelData/maps');
const data = JSON.parse(fs.readFileSync(levelsPath, 'utf8'));
let n = 0;
for (const lvl of data.levels) {
  if (lvl.chapter < 6) continue;
  const map = JSON.parse(fs.readFileSync(path.join(mapsDir, lvl.mapRef + '.json'), 'utf8'));
  const pc = map.gridStats?.playableCells;
  if (typeof pc !== 'number') throw new Error('no playableCells: ' + lvl.mapRef);
  lvl.timeLimit = pc - 15;
  n++;
}
fs.writeFileSync(levelsPath, JSON.stringify(data, null, 2) + '\\n');
console.log('updated', n, 'levels (ch6+, timeLimit = playableCells - 15)');
"
```

## 核心公式

```text
playableCells = width × height - len(forbiddenCells)
timeLimit = round(playableCells × coverageGoal × k)
```

## 設計解讀

- playable 越大、coverage 越高，timeLimit 應該越長。
- forbidden 增加通常代表空間壓力變高，但不代表一定要縮更短秒數；要看章節目標。
- `k` 是章節節奏旋鈕：同章可小幅調整，不建議跨章共用同值。

## 實務建議

- 先用公式算初值，再用章內遞增規則做二次修正。
- 當 playable 跳級（例如 10×10 -> 11×11）時，timeLimit 需要階梯式上調避免體感斷層。
- 若 coverage 同步上升，至少確認 timeLimit 不會反向下降。
