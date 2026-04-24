# 00 · One Pager（企劃一頁紙）

## 實裝來源

- 核心 loop 與分頁：[../game_design.md](../game_design.md)
- 世界觀主軸名詞：[../../../.cursor/skills/spark-invasion-lore/ref/world-background.md](../../../.cursor/skills/spark-invasion-lore/ref/world-background.md)

---

## Logline（劇情向）

人類依賴高能礦物「星火」與傳送技術，卻引來異界掠食者「噬星者」；常規火力難以滅核，前線靠**頻率共振**在格點上佈能封鎖。玩家身為戰術指揮「工匠」，在長官電報與極限時間下完成扇區佈防——這是邊界被啃食殆盡前的戰略防線敘事。

## Logline（玩法向）

摩斯電報式數字指令 + 類掃雷邏輯佈署；章節推進解鎖計時、據點、廢雷、信號輪換、定時炸點、鄰格加成與複合壓力（見 [../world_map_design.md](../world_map_design.md)）。

## 核心 Loop

1. 收報：讀取手牌／待辦電碼（長官指令）。
2. 佈署：選數字與目標格，滿足盤面邏輯與章節特殊規則（覆蓋率、據點、炸點等）。
3. 結算：邏輯矛盾即連鎖失敗；達標則推進戰役。

## 作品稱呼（企劃備註）

| 稱呼 | 建議用途 |
|------|----------|
| 《雷區指令：**星火絕境**》 | 劇情向副標、世界觀與簡報敘事（與星火／噬星者軸一致）。 |
| 《雷區指令：**電報戰線**》 | 百關戰區總綱、機制與 UI 電報意象（見 `world_map_design` 標題）。 |

兩者同一宇宙；對外一句話可擇一為主，另一作副標或 Steam 商店短描述補強。

## 目標玩家（草案）

- 喜歡邏輯解謎、掃雷類推理、願意承受**計時與章節機制壓力**的玩家。
- 能接受「教訓式長官」口氣與戰地壓迫敘事（見 [05_dialogue_voice_guide.md](05_dialogue_voice_guide.md)）。

## 平台與結構（簡述）

- Steam Windows + Electron／Vite／React（見 repo `steam-win`）。
- 關卡線性 `1..100`，十章對應十大戰區。
