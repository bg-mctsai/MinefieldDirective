---
name: mission-chapter-tactical-geography
description: >-
  調整作戰卷宗第 1～10 章戰術底圖上的地名疊字、六角關卡節點百分比座標，或換章節衛星底圖後要對齊路徑與卷宗視覺時載入。
constraints:
  - 座標須落在安全邊距內（見 `missionChapterNodePositions` 註解）；換底圖後務必對圖重校。
  - 單關微調優先使用 `levels.json` 的 `missionTacticalBriefingMap.nodePositionPct`，勿改全章佈局除非刻意重排。
updated: 2026-05-03T12:00:00+08:00
---

# 章節戰術地名與節點座標

作戰地圖（卷宗內章節展開）的**地名標**與**關卡路徑／六角位置**共用同一套 **0～100%** 座標（原點左上）。

## 涉及檔案（依修改目的開）

| 目的 | 檔案 |
|------|------|
| 地名疊字（每章 10～15 個為宜） | `steam-win/renderer/src/missionChapterBackdropGeography.ts` |
| 章節預設 8 關節點幾何＋戰術路徑 | `steam-win/renderer/src/missionChapterNodePositions.ts` |
| 實際畫面上六角與 SVG 路徑（已接佈局） | `steam-win/renderer/src/MissionMap.tsx` → `missionMapTacticalNodePct` + `resolveMissionTacticalNodePositionPct` |
| 單關覆寫座標／色票 | `steam-win/renderer/src/levelData/levels.json` → `missionTacticalBriefingMap` |
| 章節底圖 PNG | `steam-win/renderer/src/assets/mission-tactical-chapter-maps/mission-tactical-chapter-{NN}*.png`（收錄規則見 `missionTerrainByChapter.ts`） |

細部流程、驗收與命名建議：**`ref/workflow.md`**。

## Gotchas

- **MissionMap 必須**透過 `resolveMissionTacticalNodePositionPct` 讀佈局；勿再寫獨立 preset，否則 `missionChapterNodePositions` 改了畫面不變。
- 每章 `MISSION_CHAPTER_NODE_LAYOUTS` 僅需 **8 筆**（stage 1～8）；多餘索引不會被 `stageInChapter` 使用。
- 地名 HTML 疊在 `MissionChapterTacticalBackdrop` 內、**不**受 SVG `preserveAspectRatio="none"` 拉扁；節點與路徑在 SVG 內為同一百分比空間，需自洽。
- 換章節衛星圖後，**地名與節點**應一併對圖調整，避免標在海洋或與 Boss 重疊。
