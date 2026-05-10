# TimeLimit 公式與估算

## 第 1～2 章：依可玩格的固定偏移（專案約定）

「格子數」指外置地圖 `steam-win/renderer/src/levelData/maps/{mapRef}.json` 內 `gridStats.playableCells`（與 `totalCells − forbiddenCellCount` 一致）。改 `mapLayout`／`forbiddenCells` 後若需重算摘要，可執行 repo 內 `node scripts/patch-map-grid-stats.mjs`。

| 範圍 | `mapRef` | `levelId` | `timeLimit` |
|------|----------|-----------|-------------|
| 第一章（節選） | `1_3`～`1_8` | 3～8 | **`playableCells + 5`** |
| 第二章 | `2_1`～`2_8` | 9～16 | **`playableCells + 2`** |

**未套用本表者**：`1_1`、`1_2`（levelId 1、2）維持 `levels.json` 手調秒數，不強制符合上式。

套用時同步編輯 `steam-win/renderer/src/levelData/levels.json` 對應筆的 `timeLimit`（正整數）。

## 第 3～10 章：格子數即秒數（專案約定）

| 範圍 | `mapRef` | `levelId`（現行戰役） | `timeLimit` |
|------|----------|----------------------|-------------|
| 第三～十章 | `3_1`～`10_8` | 17～80 | **`playableCells`**（與可玩格 1:1） |

改動地圖後請以 `maps/{mapRef}.json` 的 `gridStats.playableCells` 為準更新 `levels.json`；亦可對 `chapter >= 3` 的關卡批次讀圖重算 `timeLimit`。

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
