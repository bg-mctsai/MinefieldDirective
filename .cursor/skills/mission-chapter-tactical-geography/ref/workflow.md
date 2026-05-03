# 章節戰術地名＋節點：工作流程

## 1. 節點路徑（全章預設）

編輯 `missionChapterNodePositions.ts` 中對應章的陣列（第 N 章 = 第 N 個內層陣列）。

- 每關一點：`stage 1` → 索引 `0` … `stage 8`（Boss）→ 索引 `7`。
- 建議邊距：**x ∈ [8, 92]、y ∈ [16, 84]**（與檔頭註解一致），避免六角與狀態標籤被裁。
- 路徑應能**順讀**（西→東、螺旋、雙錨等），與該章戰役主題一致即可；不必與現實地理一致。

## 2. 地名疊字

編輯 `missionChapterBackdropGeography.ts`：

- 在 `BY_CHAPTER` 註冊 `chapter` 鍵；常數陣列約 **10～15** 條 `{ x, y, text, align? }`。
- `align`：`start`（左對齊錨點）、`middle`、`end`，避免貼邊被裁。
- 座標避開該章 8 個節點附近約 **4～8%**，並避開 Boss 終點。

## 3. 單關微調（可選）

在 `levels.json` 該關加入：

```json
"missionTacticalBriefingMap": {
  "nodePositionPct": { "x": 44, "y": 58 }
}
```

程式會 clamp 到安全範圍（見 `missionTacticalBriefingMapResolve.ts`）。

## 4. 驗收

1. 開作戰地圖 → 進入該章 → 確認 **8 顆六角** 與 **綠色戰術路徑** 順序合理。
2. 捲動／平移底圖（若有）時地名仍貼在對應區塊。
3. 選關時簡報卡箭頭仍指向正確位置（同座標來源）。

## 5. 換底圖資產

新檔命名須被 `missionTerrainByChapter.ts` 的 glob 命中（例：`mission-tactical-chapter-03.png`）。換圖後重跑第 1～3 步。
