---
name: campaign-map-themes
description: 設計戰役第 1～10 章外置地圖（maps/{mapRef}.json）：第 1 章僅全幅方／長方形訓練營；2～10 章含 SQUARE／TRIANGLE／HEXAGON 剪影、mapTheme、產圖腳本與據點／炸點驗證。當用戶要調整關卡形狀、關卡選擇主題文案、或重跑 gen-chapter*-maps 時使用。
---

# 戰役地圖主題（Campaign Map Themes）

## 專案路徑

- 關卡數值：`steam-win/renderer/src/levelData/levels.json`（`timeLimit`、`coverageGoal`、`digitOutposts`、`blastPoints` 等）
- 地圖幾何＋主題：`steam-win/renderer/src/levelData/maps/{mapRef}.json`（通常 `mapRef` = `levelId` 字串）
- 產圖腳本（`cwd` = `steam-win`）：
  - `node scripts/gen-chapter1-maps.mjs` — 1～10，`SQUARE` 全幅矩形／正方形、**無 `forbiddenCells`**（新兵訓練營最簡）
  - `node scripts/gen-chapter2-maps.mjs` — 11～20，`SQUARE`
  - `node scripts/gen-chapter3-maps.mjs` — 21～30，`SQUARE`，**必驗 `digitOutposts`**
  - `node scripts/gen-chapter4-maps.mjs` — 31～40，`TRIANGLE`
  - `node scripts/gen-chapter5-7-hex-maps.mjs` — 41～70，`HEXAGON`
  - `node scripts/gen-chapter8-maps.mjs` — 71～80，`SQUARE`，**必驗 `blastPoints.pos`**
  - `node scripts/gen-chapter9-maps.mjs` — 81～90，依關卡 `SQUARE`／`TRIANGLE`／`HEXAGON`
  - `node scripts/gen-chapter10-maps.mjs` — 91～100（L100 僅加 `mapTheme`，保留幾何）
  - `node scripts/run-gen-ch5-10.mjs` — 依序執行上述 5～10 章產圖
- 座標驗證：`node scripts/validate-map-constraints.mjs`（`--write-times` 會依各章 playable×coverage 重寫 41～99 的 `timeLimit` 並維持**章內**遞增；**L100 不覆寫**，保留企劃終局秒數）

## 外置 JSON 契約

根物件：

```json
{
  "mapLayout": { ... },
  "mapTheme": "關卡選擇畫面顯示的一句主題（可選）"
}
```

- `mapTheme` 經 `hydrateLevelMaps` 注入 `LevelDefinition.mapTheme`，`MissionMap` 會顯示在「第 N 關」下方。
- `mapLayout` 與 `levels.json` 內嵌二擇一；併存時以**內嵌**為準（企劃勿重複維護）。

## 章節對照（`gridSystem` ↔ `mapLayout.type`）

| 章 | 關卡 | `gridSystem` | `mapLayout.type` | 備註 |
|----|------|----------------|------------------|------|
| 1 | 1–10 | SQUARE | SQUARE | 訓練營：全幅矩形、格數 **25→80** 遞增（不超過 80）；`timeLimit` ≈ `round((格/2)*1.6)+round(20*(10-id)/9)` 秒 |
| 2 | 11–20 | SQUARE | SQUARE | `width`×`height` + `forbiddenCells` |
| 3 | 21–30 | SQUARE | SQUARE | **`digitOutposts` 須在可部署格** |
| 4 | 31–40 | TRIANGLE | TRIANGLE | `placeholder` + `forbiddenCells?`；尺寸階梯見 `ch4MapLayout.ts` 的 `CH4_TRIANGLE_LAYOUTS` |
| 5 | 41–50 | HEXAGON | HEXAGON | 與第 4 章占位相同技術路徑（矩形索引 + forbidden） |
| 6–7 | 51–70 | HEXAGON | HEXAGON | 建議與第 5 章錯開剪影相位（腳本內 offset） |
| 8 | 71–80 | SQUARE | SQUARE | **`blastPoints[].pos` 須在可部署格**（非 forbidden） |
| 9 | 81–90 | 每關不同 | 須與 `gridSystem` 一致 | 全章 `neighborPlacedDigitBonus` 在 `levels.json`，不在 map 檔 |
| 10 | 91–100 | 多為 SQUARE | 依關卡 | **據點／炸點**座標須可部署；L100 大盤面保守調整 |

## 硬性檢查清單（企劃／產圖必守）

1. `digitOutposts`（若有）：每個 `[x,y]` 須 `0<=x<W`、`0<=y<H`，且**不可**出現在 `forbiddenCells`。
2. `blastPoints[].pos`（若有）：同上。
3. `forcedMineCells`（若有）：同上。
4. `HEXAGON`／`TRIANGLE`：邊界以 `placeholder.width`／`height` 為準，索引與方格占位一致。

驗證：`node scripts/validate-map-constraints.mjs`（讀 `levels.json` + 各 `maps/{mapRef}.json`）。

## 方形／占位章節

- **可部署格** = 全矩形 − `forbiddenCells`（`buildRuntimeLevel.ts` 的 `squareCells`）。
- 剪影：以可玩區域布林式生成，再對據點／炸點做 **8 鄰擴張併入可玩**（與第三章腳本相同精神），最後重算 `forbiddenCells`。

## 計時（timeLimit）

- 通式：`timeLimit ≈ max(章內遞增底線, round(playableCells × coverageGoal × k))`。
- `k` 約 1.0～1.2 依章調；勿讓關卡號變大反而時間變短。

## 其他驗證

```bash
cd steam-win
npm run lint
npm run export-levels-json
```

## 與 patch 腳本

- `patch-ch4-triangle-levels.ts` 僅同步 31～50 三角種子；寫入 maps 時 **`setMapLayoutOnLevel` 會保留既有 `mapTheme`**（`scripts/lib/levelMapFiles.ts`）。
- 企劃剪影為準時，勿再跑會覆寫幾何的舊種子 patch，除非有意還原。
