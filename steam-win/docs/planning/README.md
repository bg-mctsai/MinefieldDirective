# 遊戲企劃文件（Planning）

本目錄為《雷區指令》**敘事與企劃交付**用稿：補齊世界觀、主線時間軸、章節敘事任務、角色弧線與台詞規範，並標註**實裝來源**（JSON／TS），避免與程式內容分叉。

## 閱讀順序建議

1. [00_one_pager.md](00_one_pager.md) — 一句話賣點、核心 loop、作品稱呼分工。
2. [01_world_bible.md](01_world_bible.md) — 世界觀精簡總覽（細節以 lore ref 為準）。
3. [02_main_plot_timeline.md](02_main_plot_timeline.md) — 主線事件表（可與關卡進度對照）。
4. [03_chapter_briefs.md](03_chapter_briefs.md) — 十章戰區：機制＋敘事任務欄位。
5. [04_characters.md](04_characters.md) — 在編幹員與弧線企劃欄位（實裝以 `heroes.ts` 為準）。
6. [05_dialogue_voice_guide.md](05_dialogue_voice_guide.md) — 長官／幹員口氣與改稿原則。
7. [06_content_pipeline.md](06_content_pipeline.md) — 文案改哪個檔、合併流程與驗證指令。

## 與既有 `docs` 的關係

| 文件 | 用途 |
|------|------|
| [../game_design.md](../game_design.md) | 分頁結構、核心規則、指令系統。 |
| [../levels_100_plan.md](../levels_100_plan.md) | 百關與資料面規劃（若與本目錄並列閱讀）。 |
| [../world_map_design.md](../world_map_design.md) | **機制戰役總綱**：十大戰區、章節機制詳解；章節敘事細寫請見本目錄 `03`。 |
| [../characters.md](../characters.md) | 五人快速查表；完整企劃欄位見 [04_characters.md](04_characters.md)。 |

## 實裝索引（常改文案）

- 關卡進場長官簡報：`renderer/src/levelData/chapterEntryBriefings.json`（執行期經 `mergeChapterEntryBriefingsIntoDefinitions` 合併進關卡，見 [06_content_pipeline.md](06_content_pipeline.md)）。
- 章通關後戰地通訊：`renderer/src/levelData/dossierPostChapter10Briefings.json`。
- 幹員檔案與戰鬥台詞：`renderer/src/heroes.ts`。

## Lore 單一真理來源（名詞與背景）

- [../../../.cursor/skills/spark-invasion-lore/ref/world-background.md](../../../.cursor/skills/spark-invasion-lore/ref/world-background.md)
- [../../../.cursor/skills/spark-invasion-lore/ref/glossary.md](../../../.cursor/skills/spark-invasion-lore/ref/glossary.md)

（若 clone 路徑不同，請自專案根目錄找 `.cursor/skills/spark-invasion-lore/ref/`。）
