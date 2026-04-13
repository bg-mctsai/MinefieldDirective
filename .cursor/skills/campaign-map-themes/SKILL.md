---
name: campaign-map-themes
description: 當使用者要調整戰役地圖形狀、章節剪影、mapTheme 文案，或重跑 gen-chapter*-maps 並驗證據點/炸點合法性時使用。
constraints:
  - 任何 mapLayout 變更後，必須驗證 digitOutposts、blastPoints、forcedMineCells 都在可部署格。
  - 任何 gridSystem 變更後，必須同步檢查 levels.json 的 commands.weights 鍵上限。
  - 回覆需附可直接執行的腳本或指令順序，不可只描述概念。
---

# 戰役地圖主題（Campaign Map Themes）

目標：在不破壞可玩性的前提下，快速調整 `maps/{mapRef}.json` 的幾何與主題，並保持 `levels.json` 一致。

## 快速路由

- 章節腳本與 `gridSystem` 對照：`ref/scripts-and-chapter-matrix.md`
- 外置 JSON 契約與座標驗證：`ref/validation-and-contract.md`
- 安全改動流程與常見踩雷：`ref/gotchas-and-safe-workflow.md`

## 最小交付（每次調整都要做到）

- 明確說明調整範圍（章節/關卡）。
- 給可直接執行的腳本或命令順序。
- 完成後做一次約束驗證（據點/炸點/禁格合法）。
- 若動到 `gridSystem`，同步檢查 `commands.weights` 鍵上限。

## Gotchas（必保留）

- 只改 map 不改 `levels.json` 同步欄位，會造成執行期不一致。
- 重跑舊 patch 覆蓋新剪影，卻沒檢查 `mapTheme` 是否還在。
- 只看邊界不看 `forbiddenCells`，據點或炸點可能落在禁格。
- 鏡像 bitmap 後忘了再驗 `blastPoints.pos` 合法性。

## 交叉參照

- 若同時要重平衡 timeLimit/coverage：`.cursor/skills/level-time-adjustment/SKILL.md`
