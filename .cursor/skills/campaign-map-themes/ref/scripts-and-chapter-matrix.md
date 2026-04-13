# 章節腳本與格系對照

## 主要路徑

- 關卡主檔：`steam-win/renderer/src/levelData/levels.json`
- 外置地圖：`steam-win/renderer/src/levelData/maps/{mapRef}.json`
- 腳本執行目錄：`steam-win`

## 腳本路由

- `node scripts/gen-chapter1-maps.mjs`：Lv1～10，SQUARE 訓練營，全幅矩形/正方形。
- `node scripts/gen-chapter2-maps.mjs`：Lv11～20，SQUARE。
- `node scripts/gen-chapter3-maps.mjs`：Lv21～30，SQUARE（重點檢查 `digitOutposts`）。
- `node scripts/gen-chapter4-maps.mjs`：Lv31～40，TRIANGLE。
- `node scripts/gen-chapter5-7-hex-maps.mjs`：Lv41～70，ch5 HEX、ch6-7 混合格系。
- `node scripts/gen-chapter8-maps.mjs`：Lv71～80，鏡像 ch7 bitmap，playable 70～100。
- `node scripts/gen-chapter9-maps.mjs`：Lv81～90，鏡像 ch6（含 L70 變體），playable 70～100。
- `node scripts/gen-chapter10-maps.mjs`：Lv91～100（L100 保留幾何，主改 theme）。
- `node scripts/run-gen-ch5-10.mjs`：一次跑完 ch5～10。

## 章節格系摘要

- ch1～3：SQUARE
- ch4：TRIANGLE
- ch5：HEXAGON
- ch6～9：混合（逐關對齊 `gridSystem`）
- ch10：多為 SQUARE（依關卡設定）
