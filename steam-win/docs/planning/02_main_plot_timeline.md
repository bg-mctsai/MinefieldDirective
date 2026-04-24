# 02 · Main Plot Timeline（主線事件表）

## 實裝來源

- 章通關後「戰地通訊」線索：[../../renderer/src/levelData/dossierPostChapter10Briefings.json](../../renderer/src/levelData/dossierPostChapter10Briefings.json)（鍵 `byCompletedChapter` `"1"`～`"10"`）。
- 戰區名稱與壓力類型：[../world_map_design.md](../world_map_design.md) 十大戰區表。
- 關卡進場敘事（長官視角）：[../../renderer/src/levelData/chapterEntryBriefings.json](../../renderer/src/levelData/chapterEntryBriefings.json)。

本表為**企劃補洞用**：可與關卡進度對照；未在 JSON 明寫的因果請標 `TBD`，勿與 glossary／world-background 衝突。

---

## 欄位說明（複製列用）

| 欄位 | 說明 |
|------|------|
| 事件 ID | `EV-###` 或自訂前綴，供 `03_chapter_briefs` 引用。 |
| 章／關（約） | 對應 `chapter`／`levelId` 範圍或章末。 |
| 誰／什麼勢力 | 工匠、長官頻道、噬星者壓力、環境（沙塵、干擾）等。 |
| 工匠在場方式 | 指揮佈能、通訊解讀等（本作主視角為工匠決策）。 |
| 狀態前 → 狀態後 | 一句話戰況推進。 |
| 可見後果 | 玩家可感知或 UI 呈現的後果。 |
| 實裝線索 | 檔案與鍵名，無則 `—`。 |

---

## 事件表（初稿：已有線索 + TBD）

| 事件 ID | 章／關（約） | 誰／什麼勢力 | 工匠在場方式 | 狀態前 → 狀態後 | 可見後果 | 實裝線索 |
|----------|--------------|--------------|----------------|------------------|----------|----------|
| EV-001 | 第 1 章（約 L1–L10） | 後方演習帶、長官頻道 | 指揮佈能、讀通活命碼 | 入伍演練 → **結訓** | 解鎖巷戰壓力敘事 | `dossierPostChapter10Briefings` `byCompletedChapter."1"`；`chapterEntryBriefings` Lv1–10 |
| EV-002 | 章末 1 → 章首 2 | 噬星者壓外圍、街道時間窗口 | 同上 | 寬鬆演習 → **封鎖線限時** | 敘事上「街道不等人」 | dossier `1` `nextHazard` |
| EV-003 | 第 2 章（約 L11–L20） | 巷戰封鎖、敵潮壓境 | 同上 | 封鎖暫穩 → 轉進能源線 | 強調倒數與優先序 | dossier `2`；`world_map_design` 章 02 |
| EV-004 | 章末 2 → 章首 3 | 乾谷、戰術據點／能源 | 同上 | 巷戰窗口 → **據點必須有共振信號** | 玩法上據點未填即失敗 | dossier `2` `nextHazard`；章 03 機制 |
| EV-005 | 第 3 章（約 L21–L30） | 據點、長官 | 同上 | 覆蓋思維 → **據點＝信號** | 敘事與規則對齊 | dossier `3` |
| EV-006 | 章末 3 → 章首 4 | 三角高地、異常幾何 | 同上 | 方格習慣 → **拓撲變換** | 三角鄰接邏輯 | dossier `3` `nextHazard`；章 04 |
| EV-007 | 第 4 章（約 L31–L40） | 高地碎裂禁佈、三角格 | 同上 | 適應異形盤面 → 收束高地線 | 敘事「走出新兵腦」 | dossier `4` |
| EV-008 | 章末 4 → 章首 5 | 蜂巢六向、高密度共振 | 同上 | 三角 → **六鄰全方位** | 錯一格連鎖風險敘事 | dossier `4` `nextHazard`；章 05 |
| EV-009 | 第 5 章（約 L41–L50） | 蜂巢防線 | 同上 | 六向圍毆感 → 佈陣歸檔 | 空間警覺 | dossier `5` |
| EV-010 | 章末 5 → 章首 6 | 深海要塞、廢雷／巴克嗅敵 | 同上 | 六角 → **廢料與廢雷雜訊** | 判讀假目標 | dossier `5` `nextHazard`（巴克）；章 06 |
| EV-011 | 第 6 章（約 L51–L60） | 深海、偽目標 | 同上 | 深潛雜訊 → 記錄戰事 | 「聽不見的威脅」 | dossier `6` |
| EV-012 | 章末 6 → 章首 7 | 信號干擾、跳頻手牌 | 同上 | 海底真信號 → **手牌輪播** | 抓窗口出手 | dossier `6` `nextHazard`；章 07 |
| EV-013 | 第 7 章（約 L61–L70） | 干擾帶 | 同上 | 變速碼上鎖定 → 戰況寫入 | 節奏留在手裡 | dossier `7` |
| EV-014 | 章末 7 → 章首 8 | 引爆危機、定時炸點 | 同上 | 亂流佈局 → **多面倒數排程** | 排程優先敘事 | dossier `7` `nextHazard`；章 08 |
| EV-015 | 第 8 章（約 L71–L80） | 定時炸點 | 同上 | 多點同塌 → 引爆帶寫入 | 「真工兵的腦」 | dossier `8` |
| EV-016 | 章末 8 → 章首 9 | 鄰焰共振／熱力迴聲 | 同上 | 靜態數思維 → **動態加成** | 與 `neighborPlacedDigitBonus` 敘事對齊 | dossier `8` `nextHazard`；章 09 |
| EV-017 | 第 9 章（約 L81–L90） | 迴聲戰帶 | 同上 | 加成與盤面並算 → 迴聲帶寫入 | 熱不幫人寫劇情 | dossier `9` |
| EV-018 | 章末 9 → 章首 10 | 終焉防線、沙塵＋信號崩＋時限 | 同上 | 迴聲 → **全壓力疊加** | 無退路菜單敘事 | dossier `9` `nextHazard`；章 10 |
| EV-019 | 第 10 章（約 L91–L100） | 終柵、全線崩潰 | 同上 | 最後扇區死守 → **終柵戰果歸檔** | 通關敘事；明言非終戰 | dossier `10` |
| EV-020 | 章後（敘事層） | 戰況、長官 | 工匠存活與否 TBD | 終柵通過 → 戰爭仍計價進行 | 「靜可能是下一波前奏」 | dossier `10` `nextHazard` |
| EV-TBD-01 | TBD | TBD | TBD | **具名事件／NPC 抉擇／陣營內鬥** | TBD | 無；需企劃補寫且不違 glossary |
| EV-TBD-02 | TBD | 噬星者／裂隙 | TBD | **單一關鍵戰役的戰前／戰後世界狀態** | TBD | 無 |

---

## 使用備註

- 新增主線事件時：先加列、配新 `EV-###`，再在 [03_chapter_briefs.md](03_chapter_briefs.md) 的「主線節點 ID」欄引用。
- 若與關卡 `title`／`mapTheme` 衝突，以 **關卡 JSON** 與 **lore ref** 為準修正本表描述句，不反過來改機制資料。
