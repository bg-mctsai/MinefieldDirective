---
name: spark-invasion-lore
description: 撰寫或校對《雷區指令》星火與噬星者異界入侵世界觀、戰役與關卡敘事時，需與名詞定義及背景設定一致則使用。
constraints:
  - 名詞與背景敘事以本 skill 的 `ref/glossary.md`、`ref/world-background.md` 為準；不自行發明與之衝突的設定。
  - 不處理可變角色之即時台詞、關卡地圖幾何、關卡流程與劇情時間軸；見下方「目前範圍外」。
updated: 2026-04-24T12:00:00+08:00
---

# 星火入侵世界觀（Spark Invasion Lore）

**劇情主軸**亦稱《**雷區指令：星火絕境**》。目標：讓戰役／簡報／系統敘事共用**同一套**異界入侵設定與專有名詞，避免多頭馬車。

## 快速路由

- 背景敘事（兩段主軸）：`ref/world-background.md`
- 名詞定義與遊戲內指涉：`ref/glossary.md`

## 與本專案其他內容的關係

- **玩家角色**：敘事上固定為**工匠（Artisan）**；實作上是否具名、介面用語可與「前沿作戰幹員」等 UI 文字並存，但世界觀層級以工匠為準。
- **遊戲玩法詞**（如：長官電報、佈雷、雷區、鄰焰共振等）屬**操作層**；本 skill 的**物理解釋**為：戰場上佈下的是**星火共振**原理的作戰裝具，劇情可從戰情角度用「能量頻率／共振節點」等帶過，**不必在每一句改寫機制名**。
- 撰寫須**可貼入 JSON 的實作文案**（進場簡報、固定訊息等）時，口氣與規則可讀性另遵守：`.cursor/skills/emotion-route-balance/SKILL.md`。

## 目前範圍外（刻意不寫死）

- **可變角色的動態回饋台詞**（如各幹員 bark、戰況情緒句）：人選與台詞可能重調，不收入本 skill。
- **關卡地圖、據點形狀、章節戰役路線**：見 `.cursor/skills/campaign-map-themes/SKILL.md`。
- **關卡時間、難度、流程推演與劇情年表**：見 `.cursor/skills/level-time-adjustment/SKILL.md` 或專案文件；本 skill 只處理**世界觀與名詞**層。

## 交叉參照

- 關卡長官口氣與簡報 JSON 交付：`.cursor/skills/emotion-route-balance/SKILL.md`
- 戰役地圖幾何與 `mapTheme`：`.cursor/skills/campaign-map-themes/SKILL.md`

## Gotchas

- 把「星火」寫成無限能源神棍設定，會與**必須精密頻率才能毀壞噬星者核心**的戰術感衝突。
- 把噬星者寫成有文明、有談判餘地，與**純粹掠食**的設定衝突。
- 在簡報裡硬塞教學規則卻漏掉情緒——應交給 `emotion-route-balance` 的「規則與情緒並存」原則，本 skill 不取代玩法說明。
