---
name: level-time-adjustment
description: 當使用者要調整 levels.json 的 timeLimit、coverageGoal、地圖大小、forbiddenCells，或要求某章關卡重平衡與 timeLimit 規則校正時使用。
constraints:
  - 優先維持章內難度與 timeLimit 單調遞增，不可出現後關卡明顯變簡單。
  - 任何 gridSystem 或 mapLayout 變更，必須同步檢查 commands.weights 可用鍵上限。
  - 回覆必須提供可直接套用的修改內容或腳本，不只給抽象建議。
---

# Level Time Adjustment

目標：快速、安全地重平衡 `steam-win/renderer/src/levelData/levels.json` 的關卡節奏，不破壞 grid 規則與章節曲線。

## 快速路由

- 公式、`k` 係數、時間估算：`ref/formulas-and-heuristics.md`
- `gridSystem` 與 `commands.weights` 上限：`ref/grid-weights-and-gotchas.md`
- 章節基準（ch3/ch5-7）與歷史參照：`ref/chapter-baselines.md`

## 最小交付（每次調整都要做到）

- 明確列出影響關卡（例：Lv24～Lv30）。
- 提供可直接套用的修改內容（JSON 片段或 `scripts/patch-*.ts`）。
- 說清楚新 `timeLimit` 依據（`playableCells`、`coverageGoal`、`k`）。
- 確認 `gridSystem` ↔ `commands.weights` 鍵合法。

## Gotchas（必保留）

- 只改 `timeLimit`、沒檢查 weights 鍵上限，會產生不可放置手牌。
- 改 `forbiddenCells` 後沒重算 playable，會讓估時失真。
- 跨章硬套同一個 `k`，會抹平章節節奏差異。
- 只講原理不給可執行 patch，等於不可交付。

## 交叉參照

- 地圖剪影/章節 mapTheme/產圖流程：`.cursor/skills/campaign-map-themes/SKILL.md`
