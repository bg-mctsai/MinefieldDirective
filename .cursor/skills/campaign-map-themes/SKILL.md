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
  - `node scripts/gen-chapter5-7-hex-maps.mjs` — 41～70，ch5 全 `HEXAGON`；ch6–7 混合 `HEXAGON`／`TRIANGLE`／`SQUARE`（自動同步 `gridSystem`）；剪影資料在 `scripts/lib/ch6BitmapShapes.mjs`、`ch7BitmapShapes.mjs`
  - `node scripts/gen-chapter8-maps.mjs` — 71～80，**L61～L70 剪影水平鏡像**（手調 bitmap，`playable` **70～100**），`SQUARE`／`TRIANGLE`／`HEXAGON` 與來源關卡一致；**必驗 `blastPoints.pos`**，炸點自動挑在 `#`；同步 `levels.json` 的 `gridSystem`／`commands.weights`
  - `node scripts/gen-chapter9-maps.mjs` — 81～90，**第 6 章剪影鏡像（81～89）+ L70 鏡像（90）**，`playable` **70～100**
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
| 5 | 41–50 | HEXAGON | HEXAGON | bitmap 剪影（章魚、板手、骷髏…），playable 72～86 |
| 6 | 51–60 | **混合** | 須與 `gridSystem` 一致 | 4 HEX + 3 TRI + 3 SQ；bitmap 剪影（水母、三叉戟、鯊魚鰭…） |
| 7 | 61–70 | **混合** | 須與 `gridSystem` 一致 | 4 HEX + 3 TRI + 4 SQ；bitmap 剪影（天線塔、雷達碟、火箭筒…） |
| 8 | 71–80 | **混合** | 須與 `gridSystem` 一致 | 鏡像第 7 章 bitmap；可玩 **70～100**；**`blastPoints[].pos` 須在可部署格** |
| 9 | 81–90 | 每關不同 | 須與 `gridSystem` 一致 | 鏡像第 6 章（＋L70）bitmap；可玩 **70～100**；`neighborPlacedDigitBonus` 在 `levels.json` |
| 10 | 91–100 | 多為 SQUARE | 依關卡 | **據點／炸點**座標須可部署；L100 大盤面保守調整 |

## 指令數字上限（依 `gridSystem` 硬性限制）

| `gridSystem` | 允許數字範圍 | `commands.weights` 可用鍵 |
|--------------|-------------|--------------------------|
| TRIANGLE     | **1～3**    | `"1"`, `"2"`, `"3"`      |
| HEXAGON      | **1～6**    | `"1"` … `"6"`            |
| SQUARE       | **1～8**    | `"1"` … `"8"`            |

- 這是**上限**，不是必須全給；設計上可以只開部分數字。
- 產圖腳本 `gen-chapter5-7-hex-maps.mjs` 已自動同步 `gridSystem`，但 **`commands.weights`** 須另行維護。
- 若切換某關的 `gridSystem`（例如從 HEXAGON 改 TRIANGLE），**必須同步刪除超出上限的 weights 鍵**（7、8 或 4～8），否則 `generateHand` 會產生無法放置的指令。
- **信號干擾輪播**（`commandSlotReceiveJamming`）已依 `gridSystem` 動態限制 pingpong 範圍（`signalJamming.ts` 的 `maxDigitForGrid`）。

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
