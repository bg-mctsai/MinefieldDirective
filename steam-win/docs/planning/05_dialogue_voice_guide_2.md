# 《雷區指令：星火絕境》文案與對話規範 V2

> **與 V1 的關係**：本頁補強**靜默、潛行、地雷佈署**與**動態火力無效**的敘事語氣；硬性規則（規則與情緒並存、JSON 交付位置等）仍以 [05_dialogue_voice_guide.md](05_dialogue_voice_guide.md) 與  
> [`.cursor/skills/emotion-route-balance/SKILL.md`](../../../.cursor/skills/emotion-route-balance/SKILL.md) 為準。兩者衝突時：**機制可讀性／JSON 規範**優先，本 V2 負責**世界觀氛圍與用詞傾向**。

世界觀生理設定見：[01_world_bible_2.md](01_world_bible_2.md)。

---

## 一、核心氛圍

- **關鍵詞**：低調、靜默、潛行、致命、佈署節奏。
- **核心敘事矛盾**：強大的噬星者（**動態偵知與防禦極強**）vs. 必須**緩慢移動**的工匠（**靜態地雷佈署**）。

---

## 二、角色聲線規範

### 1. 指揮長官（The Commander）

- **語氣**：嚴厲、壓低聲量（戰地耳語感）、強調紀律與**速度控制**。
- **規範**：
  - 少用大吼「激勵」；多強調**不要驚動目標**、**動作放慢**。
  - 若提到槍械，宜作為**錯誤選項或自殺行為**點出，而非鼓吹開火。
- **範例**：
  - 「保持靜默。那畜生正在休息，慢慢把地雷放下去，別讓牠的動態視網膜捕捉到你。」
  - 「你那管槍只會讓你死得更快。用腦子想，用手去埋，地雷才是你的保命符。」

### 2. 幹員台詞（Operatives）

- **語氣**：高度緊張但專業，語句短促。
- **規範**：
  - 強調動作的**緩慢**與**精準**；與 `heroes.ts` 人設並存時，不刪玩法提示（見 V1 表）。
- **範例**：
  - 「（壓低）我正在牠腳邊……地雷設置完成，牠完全沒發現。」
  - 「別動！你剛剛太快了，差點餵給牠的動態偵測。」

---

## 三、系統提示語（建議向，非強制實裝）

可依產品 tone 調整用字；下列僅供敘事一致參考：

| 情境 | 示例 |
|------|------|
| 佈雷成功 | `[系統]` 地雷已進入靜態隱匿模式。 |
| 引起注意 | `[警報]` 偵測到超額動態量，噬星者反應機制激活中。 |
| 擊殺／重創回饋 | `[反饋]` 靜態打擊成功，目標核心瓦解。 |

---

## 四、關鍵詞彙禁忌與推薦（敘事層）

下列為**世界觀台詞**傾向，不取代 UI 既有字串審查流程。

| 類型 | 建議 |
|------|------|
| **宜少用在「官方戰法」語境** | 開火、突擊、轟炸、掃射（若出現，宜為錯誤、絕望或敘述他線戰場，而非本玩法主軸）。 |
| **推薦** | 佈設、設置、靜默移動、引爆、塌陷、覆蓋率、格點（與 glossary／關卡 JSON 一致處沿用）。 |

---

## 五、交付物位置（改稿時改這裡）

與 [05_dialogue_voice_guide.md](05_dialogue_voice_guide.md) 第五節相同；摘錄如下：

| 內容類型 | 主要檔案 |
|----------|----------|
| 關卡進場長官簡報 | [../../renderer/src/levelData/chapterEntryBriefings.json](../../renderer/src/levelData/chapterEntryBriefings.json) |
| 章通關後戰地通訊 | [../../renderer/src/levelData/dossierPostChapter10Briefings.json](../../renderer/src/levelData/dossierPostChapter10Briefings.json) |
| 幹員動態台詞 | [../../renderer/src/heroes.ts](../../renderer/src/heroes.ts) |
| 其他固定 UI 句 | [../../renderer/src/game/gameFixedMessages.json](../../renderer/src/game/gameFixedMessages.json) |
