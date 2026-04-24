# 05 · Dialogue & Voice Guide（台詞與口氣）

## 實裝與規範來源

- Cursor skill（長官語氣、嚴厲／關懷、JSON 交付）：[../../../.cursor/skills/emotion-route-balance/SKILL.md](../../../.cursor/skills/emotion-route-balance/SKILL.md)
- 同 skill 下細則與檢查清單：`ref/sergeant-tone-rules.md`、`ref/dialogue-expansion-checklist.md`、`ref/lv1-tone-pack.md`（路徑在該 skill 目錄內）。

本頁為**給非 Cursor 协作者**的濃縮版；改關鍵規則時以 **skill 與 ref** 為準，並回來更新本頁摘要。

---

## 角色聲線分工

| 聲道 | 職責 | 句長與節奏 | 底線 |
|------|------|------------|------|
| **長官（電報／簡報）** | 戰情壓力、教學可讀性、保命感 | 偏短句；可嚴厲但非純辱罵、非純雞湯 | 預設「教訓大頭兵」：硬、直白、帶保命意味 |
| **工匠（玩家）** | 決策身分；是否具名由專案決定 | UI 以指令為主，少長独白 | 與 glossary「工匠」一致 |
| **在編幹員** | 戰鬥內 `barrage`、作戰地圖一句等 | 依人設：`heroes.ts` | 不為了玩梗刪除規則提示（規則在教學／簡報層已給時，幹員可偏情緒） |
| **系統／中性旁白** | 規則確認、錯誤提示 | 清楚優先於情緒 | 避免與長官口氣混用同屏打架 |

---

## 長官簡報硬性原則（摘自 skill）

1. **規則與情緒並存**：不可為了情緒刪掉玩法資訊（先選電報數字、再選座標、失誤可重練等，依該關實際需保留者為準）。
2. **短**：建議每關進場 **1～2 句**為主；玩家已從盤面直接看見的資訊不必重複寫進簡報。
3. **嚴厲／關懷分支**：若做雙路線，差異放在**情緒與關係**，不改機制說明；交付物為可貼上 JSON 片段（見 skill）。
4. **批量改一章**：先統一章口氣，再讓每關各有一句自己的壓力點，避免十關同句換字。

---

## 與世界觀用語

- 世界觀層可用星火、噬星者、共振等（見 [01_world_bible.md](01_world_bible.md) 連結的 glossary）。
- **機制專名**（如鄰焰共振、熱力迴聲）與關卡 JSON 一致，勿在台詞裡用另一套無關物理名取代（見 glossary「鄰焰共振」列）。

---

## 交付物位置（改稿時改這裡）

| 內容類型 | 主要檔案 |
|----------|----------|
| 關卡進場長官簡報、`chapterTone`／`levelBriefing` | [../../renderer/src/levelData/chapterEntryBriefings.json](../../renderer/src/levelData/chapterEntryBriefings.json) |
| 章通關後戰地通訊 | [../../renderer/src/levelData/dossierPostChapter10Briefings.json](../../renderer/src/levelData/dossierPostChapter10Briefings.json) |
| 幹員動態台詞、檔案引言 | [../../renderer/src/heroes.ts](../../renderer/src/heroes.ts) |
| 其他固定 UI 句 | [../../renderer/src/game/gameFixedMessages.json](../../renderer/src/game/gameFixedMessages.json)（及同目錄 `.ts` 封裝） |
