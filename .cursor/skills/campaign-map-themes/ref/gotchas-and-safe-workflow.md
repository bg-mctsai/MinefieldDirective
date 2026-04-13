# 安全改動流程與 Gotchas

## 安全流程（短版）

- 先定義目標：章節、剪影、playable 區間、theme 文案。
- 跑對應 `gen-chapter*-maps` 腳本。
- 立即跑 `validate-map-constraints.mjs` 檢查座標合法。
- 若動到 `gridSystem`，同步修正 `commands.weights` 鍵上限。
- 最後確認章內 timeLimit 節奏沒有被連帶破壞。

## Gotchas

- 只改 `maps/*.json`，忘記同步 `levels.json`（`gridSystem`/`weights`）。
- 重跑舊 patch 腳本覆蓋新剪影，不自知。
- 鏡像只改 bitmap，不改 `blastPoints.pos`。
- 調 playable 區間後未重看 timeLimit 曲線。

## 補充

- `gen-chapter5-7-hex-maps.mjs` 會同步 `gridSystem`，但不會自動幫你修所有 weights。
- `patch-ch4-triangle-levels.ts` 只適合特定回填情境，企劃版剪影不應反覆覆寫。
