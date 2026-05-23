# 07 · 角色個性與說話方式（Voice Profiles）

> **完整版（撰寫時請以此為準）**：[`.cursor/skills/emotion-route-balance/ref/character-voice-profiles.md`](../../../.cursor/skills/emotion-route-balance/ref/character-voice-profiles.md)  
> **幹員實裝**：[../renderer/src/heroes.ts](../renderer/src/heroes.ts) · **長官口氣**：[05_dialogue_voice_guide.md](05_dialogue_voice_guide.md)

本頁為企劃速查；細節、句型模板、禁忌與檢查清單見 skill ref。

---

## 聲道分工

| 聲道 | 人格關鍵字 | 主要檔案 |
|------|------------|----------|
| **長官** | 嘴硬護短、教訓大頭兵、靜默佈署 | `chapterEntryBriefings.json` |
| **工匠（玩家）** | 決策者、UI 指令為主 | 介面文案 |
| **幹員** | 依下表 | `heroes.ts` |
| **系統** | 清楚、中性 | `gameFixedMessages.json` |

---

## 幹員速查表

| id | 姓名 | 代號 | 一句話 | 比喻域 | 口氣 |
|----|------|------|--------|--------|------|
| xiaoming | 小明 | 白紙 | 怕但敢跟電報走的新兵 | 運氣、呼吸、全家福 | 結巴、口語、自我懷疑 |
| ada | 艾達 | 幽靈頻率 | 衝擊後只信頻譜 | 波形、雜訊、收斂、時基 | 冷、準、像報讀參數 |
| selina | 賽琳娜 | 地圖師 | 腦內格網比紙圖可靠 | 等高線、稜線、地形 | 短、斷、不愛解釋 |
| bobby | 波比 | 雙子 | 與巴克分工搜救 | 氣味、線索、風向 | 直球、對犯錯沒耐心 |
| laozhang | 老張 | 城牆 | 樑塌過所以嘴硬手快 | 結構、灌漿、連鎖 | 沉穩、護短、工地帶班 |
| tungsten | 堡壘-09 | 鎢鋼 | 操作員離線的自律機體 | 標定、承載、序列 | 零情緒、機械報告 |
| claire | 克萊兒 | Psi-Link | 看生命網格的戰醫 | 生命訊號、清創、毒性 | 冷靜監測、隱藏共情疲勞 |

---

## 長官（指揮長官）

- **人格**：嚴厲 + 保命；罵你是為了不看你送命。
- **句型**：先壓錯 → 再給台階；12～28 字；每關 1～2 句。
- **V2 補強**：壓低聲量、強調靜默佈署與速度控制。
- **細則**：[sergeant-tone-rules.md](../../../.cursor/skills/emotion-route-balance/ref/sergeant-tone-rules.md)

---

## 撰寫禁忌（全員）

- 噬星者不可談判、不可寫成文明使節
- 星火不可神棍化
- 官方戰法不宜衝鋒／開火／轟炸
- **戰場句**（`barrage`、對局狀態）要口語，不要簡報／報告體；**09 例外**（維持機械句）
- 艾達：不可失聲、不可聽懂噬星者
- 09：不可口語、幽默、恢復人性
- 克萊兒：不可聖母／先知；異常來自讀數非幻聽

---

## 舊存檔 id

`recruit`→小明、`ellie`→艾達、`buck`→老張
