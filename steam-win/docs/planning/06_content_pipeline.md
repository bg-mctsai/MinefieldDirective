# 06 · Content Pipeline（文案與資料管線）

## 實裝來源索引

| 內容類型 | 檔案 | 備註 |
|----------|------|------|
| 關卡本體（計時、機制開關、`chapter`、`mapLayout` 等） | [../../renderer/src/levelData/levels.json](../../renderer/src/levelData/levels.json) | 企劃欄位說明見 [../../renderer/src/levelData/plannerFieldDocs.ts](../../renderer/src/levelData/plannerFieldDocs.ts) |
| 關卡進場長官簡報（集中編修） | [../../renderer/src/levelData/chapterEntryBriefings.json](../../renderer/src/levelData/chapterEntryBriefings.json) | 鍵為字串化 `levelId`；值可為字串陣列或 `{ chapterTone?, levelBriefing? }` |
| 章通關後檔案／戰地通訊 | [../../renderer/src/levelData/dossierPostChapter10Briefings.json](../../renderer/src/levelData/dossierPostChapter10Briefings.json) | `byCompletedChapter` |
| 幹員設定與 bark | [../../renderer/src/heroes.ts](../../renderer/src/heroes.ts) | `HEROES`、`barrage`、`missionBrief*` |
| 對局戰鬥台詞（依幹員） | [../../renderer/src/game/gameFixedMessages.json](../../renderer/src/game/gameFixedMessages.json) | `byHero`：開局／落格／勝敗／提示列／敗北；`cellTooltip` 仍為中性機制 |
| 戰役機制總綱（企劃） | [../world_map_design.md](../world_map_design.md) | 與 `levels.json` 需一致 |
| 匯出／驗證關卡 JSON | [../../package.json](../../package.json) `scripts` | `npm run export-levels-json`（[../../scripts/export-levels-json.ts](../../scripts/export-levels-json.ts)） |

---

## 長官簡報如何進遊戲（merge）

執行期並非直接只讀 `chapterEntryBriefings.json` 取代整關；而是由 **`mergeChapterEntryBriefingsIntoDefinitions`** 將 `byLevelId` 合併進每筆 `LevelDefinition`：

- 實作：[../../renderer/src/levelData/mergeChapterEntryBriefings.ts](../../renderer/src/levelData/mergeChapterEntryBriefings.ts)
- 呼叫點：[../../renderer/src/levelData/index.ts](../../renderer/src/levelData/index.ts)（載入 `levels` 後套用 merge）

**企劃需知道的行為摘要**：

- 單關可設 `entryBriefingEnabled: false` 關閉簡報注入。
- **章首回退**：若某關在 JSON 無專屬條目，且該關為該章**第一關**（L11、L21…），且 `levelEntryBriefingFallbackToChapterStart` 未設為 `false`，會回退讀取該章章首鍵（如 `11`、`21`）的條目；**同章其他關**不應因預設而每關都吃同一段——細則見 merge 檔案註解。
- 舊格式「整段字串陣列」仍視為 `levelBriefing` 相容。

---

## 建議工作流程（簡短）

1. 改機制／計時／開關 → 編 `levels.json`（或外置 `maps`，見 `plannerFieldDocs` 的 `mapRef`）。
2. 改進場敘事／長官口氣 → 編 `chapterEntryBriefings.json`，對照 [05_dialogue_voice_guide.md](05_dialogue_voice_guide.md)。
3. 改章末通訊 → 編 `dossierPostChapter10Briefings.json`。
4. 改幹員檔案與 bark → 編 `heroes.ts`。
5. 改對局內狀態／落格／勝敗／電報提示列台詞 → 編 `gameFixedMessages.json` 的 `byHero`（見 [07_character_voice_profiles.md](07_character_voice_profiles.md)）。
6. 存檔後執行 `npm run export-levels-json`（於 `steam-win` 目錄）驗證並更新匯出產物（若你們流程依賴該指令）。

---

## 與企劃文件的分工

| 企劃文件 | 與實裝關係 |
|----------|------------|
| [02_main_plot_timeline.md](02_main_plot_timeline.md) | 事件表；定稿新事件後再決定是否加關 `narrativeFlag` 等（視 `levels` 的 `rewards` 實作進度）。 |
| [03_chapter_briefs.md](03_chapter_briefs.md) | 敘事任務與機制對齊；**不**自動同步 JSON，需人工對表。 |

> 修正：02 link typo - I wrote main_plot_timime.md - need to fix 06 to main_plot_timeline.md

I'll fix that typo in 06_content_pipeline.md




StrReplace