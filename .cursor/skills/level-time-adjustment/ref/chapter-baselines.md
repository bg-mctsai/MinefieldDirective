# 章節基準資料

## Chapter 3（Lv21～30）

| Lv | Grid | Forbidden | playable | coverageGoal | timeLimit |
|---|---|---:|---:|---:|---:|
| 21 | 10×10 | 4 | 96 | 0.70 | 81 |
| 22 | 10×10 | 6 | 94 | 0.71 | 80 |
| 23 | 10×10 | 8 | 92 | 0.72 | 79 |
| 24 | 11×11 | 4 | 117 | 0.72 | 101 |
| 25 | 11×11 | 7 | 114 | 0.73 | 100 |
| 26 | 11×11 | 10 | 111 | 0.73 | 97 |
| 27 | 11×11 | 13 | 108 | 0.73 | 95 |
| 28 | 12×12 | 5 | 139 | 0.73 | 122 |
| 29 | 12×12 | 9 | 135 | 0.74 | 120 |
| 30 | 12×12 | 14 | 130 | 0.75 | 117 |

- 典型節奏：10×10 -> 11×11 -> 12×12 三階段。
- Lv30 是 triple penalty（高 coverage + 高 forbidden + 壓秒）。

## Chapter 6～10（Lv41～80）`timeLimit` 公式

- **公式**：`timeLimit = playableCells − 15`（見 `formulas-and-heuristics.md`）。
- **地圖來源**：`steam-win/renderer/src/levelData/maps/{mapRef}.json` → `gridStats.playableCells`。
- **典型秒數帶**：ch6～9 多為 **57～66**；ch10 為 **85～102**（大地圖 playable 100+）。
- 第 6 章地圖幾何為 **六角／方格混用**（非全 HEXAGON）；估時仍只依 `playableCells`，與 `mapLayout.type` 無關。

## Chapter 5～7 建議 `k`（歷史參照）

以下 `k` 僅供舊版手調／coverage 估算對照；**ch6 起以 `playableCells − 15` 為準，勿用 `k` 覆寫**。

| gridSystem | weights 範例 | `k` |
|---|---|---:|
| TRIANGLE | `{"1":28,"2":34,"3":38}` | 1.08 |
| HEXAGON | `{"1":18,"2":22,"3":20,"4":18,"5":12,"6":10}` | 1.08 |
| SQUARE | `{"1":6,"2":8,"3":10,"4":12,"5":14,"6":16,"7":17,"8":17}` | 1.08 |

## 歷史參照（Chapter 2）

- 舊版時間是線性：84, 92, 100 ... 156（非 playable 驅動）。
- 只當比較基準，不建議直接復用。
