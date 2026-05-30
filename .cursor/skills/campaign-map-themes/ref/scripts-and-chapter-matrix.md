# 章節腳本與格系對照

## 主要路徑

- 關卡主檔：`steam-win/renderer/src/levelData/levels.json`
- 外置地圖：`steam-win/renderer/src/levelData/maps/{mapRef}.json`
- 腳本執行目錄：`steam-win`

## 腳本路由

- `node scripts/gen-chapter1-maps.mjs`：Lv1～10，SQUARE 訓練營，全幅矩形/正方形。
- `node scripts/gen-chapter2-maps.mjs`：Lv11～20，SQUARE。
- `node scripts/gen-chapter3-maps.mjs`：Lv21～30，SQUARE（重點檢查 `digitOutposts`）。
- `node scripts/gen-chapter4-hex-maps.mjs`：maps/4_1～4_8，HEXAGON（蜂巢戰線全章）。
- `node scripts/patch-ch4-10-terrain-restructure.mjs`：第 4～10 章地形重構（合併 ch4/ch5、後章六角縮減）。
- `node scripts/gen-chapter5-7-hex-maps.mjs`：歷史產圖；ch5 現為方格為主，勿無腦重跑覆蓋 5_1～5_5。
- `node scripts/gen-chapter8-maps.mjs`：Lv71～80，鏡像 ch7 bitmap，playable 70～100。
- `node scripts/gen-chapter9-maps.mjs`：Lv81～90，鏡像 ch6（含 L70 變體），playable 70～100。
- `node scripts/gen-chapter10-maps.mjs`：Lv91～100（L100 保留幾何，主改 theme）。
- `node scripts/run-gen-ch5-10.mjs`：一次跑完 ch5～10。

## 章節格系摘要

- ch1～3：SQUARE
- ch4：HEXAGON（全章 8 關）
- ch5：SQUARE×5 + HEXAGON×3（`5_6`～`5_8`）
- ch6～9：每章約 3 關 HEXAGON、其餘 SQUARE
- ch10：多為 SQUARE；`10_2`、`10_3` 為 HEXAGON
