---
name: level-time-adjustment
description: 調整 MinefieldDirective levels.json 中各關卡的 timeLimit、coverageGoal、地圖大小與 forbiddenCells。當用戶要求調整某段關卡的時間、地圖設計、覆蓋率，或詢問 timeLimit 設計規則時使用。
---

# Level Time Adjustment

## 專案資訊

- 設定檔：`steam-win/renderer/src/levelData/levels.json`
- 批次修改用腳本位置：`steam-win/scripts/`（推薦用 tsx 執行）

## 核心公式

```
playableCells = width × height - len(forbiddenCells)
timeLimit = round(playableCells × coverageGoal × k)
```

- **k（係數）**：依章節調整。第 3 章用 `k = 1.2`。
- 可用格越多 × 覆蓋率越高 → 時間越長
- forbidden 越多 → 可用格越少 → 時間越短（設計上代表空間緊迫、難度更高、給更少時間）

## 第 3 章（21~30 關）實際套用

| Lv | Grid  | Forbidden | 可用格 | CovGoal | timeLimit |
|----|-------|-----------|--------|---------|-----------|
| 21 | 10×10 | 4         | 96     | 0.70    | 81s       |
| 22 | 10×10 | 6         | 94     | 0.71    | 80s       |
| 23 | 10×10 | 8         | 92     | 0.72    | 79s       |
| 24 | 11×11 | 4         | 117    | 0.72    | 101s      |
| 25 | 11×11 | 7         | 114    | 0.73    | 100s      |
| 26 | 11×11 | 10        | 111    | 0.73    | 97s       |
| 27 | 11×11 | 13        | 108    | 0.73    | 95s       |
| 28 | 12×12 | 5         | 139    | 0.73    | 122s      |
| 29 | 12×12 | 9         | 135    | 0.74    | 120s      |
| 30 | 12×12 | 14        | 130    | 0.75    | 117s      |

**地圖分階段設計**：10×10（L21-23）→ 11×11（L24-27）→ 12×12（L28-30）

**最難關設計原則（L30）**：同階段最多 forbidden + 最高覆蓋率 + 最短時間 = triple penalty

## 修改步驟

1. **確認目標關卡的地圖尺寸與 forbiddenCells 數量**（從 levels.json 查詢）
2. **計算 playableCells 與 timeLimit**（套用公式）
3. **批次修改時**：寫 `steam-win/scripts/patch-*.ts`，用 `npx tsx scripts/patch-*.ts` 執行
4. **單關修改時**：直接用 StrReplace 替換 `coverageGoal`、`timeLimit`、`mapLayout` 欄位

## 參考：第 2 章（11~20 關）

舊版為簡單線性設計（非格子數驅動），僅供歷史參考：
從 84s 開始，每關 +8s（84, 92, 100 … 156），地圖交替 CROSS 11×11 / DIAMOND r=4。
