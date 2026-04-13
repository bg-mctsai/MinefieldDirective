# 從打造 Claude Code 學到的 Skills 核心精華

> **本文件性質**：給人讀的詳盡筆記（非 Cursor/Claude 會自動載入的 `SKILL.md`）。內含九類分類、九個進階技巧與每條的範例說明，方便對照實作與團隊內分享。

> 一句話：**好 skill 不靠一次寫完，而是先上線最小版本，持續把踩坑經驗（Gotchas）補進去。**

## 這篇最重要的三件事

1. **先分類再設計**：一個 skill 最好只屬於一種用途；跨太多類通常代表要拆分。  
2. **skill 是資料夾，不是單一 prompt**：用 `SKILL.md` 當中樞，搭配 `ref/`、`assets/`、`scripts/` 做漸進式揭露。  
3. **品質靠迭代，不靠完美首版**：每次失誤就補一條 Gotcha，skill 會越用越準。

---
## 當你用本指南優化其他 skill 時（採用優化內容優先）
- **預設要「直接搬運」本文件已最佳化的落地寫法**：例如 `Gotchas` 區塊、hub+`ref/` 結構、`目標 + 約束 + 成功條件` 的句型，應優先原樣貼到被優化 skill（只做必要的等價替換：skill 名稱、檔名路徑、專案用詞）。
- **不要只吸收概念**：原則可以被理解，但最後必須落地成被優化 skill 內的具體段落/欄位/目錄（`Gotchas`、`ref/` 導覽、可複製的程式碼/腳本、`description` 的觸發詞）。
- **遇到衝突以本指南的「必守項」為準**：只要被優化 skill 的寫法違反以下必守項，就必須改：九類/九技巧框架、`Gotchas` 區塊、`description` 僅寫觸發條件（不寫功能摘要、不把執行約束塞進 frontmatter）、不要寫死 Step 1/2/3。
- **已有內容怎麼辦**：若被優化 skill 已有 `Gotchas` / hub + `ref/`，就追加缺漏與修正衝突點；不要用另一套架構「重寫成完全不同風格」，除非必要。

---

## 九類 Skills 分類框架（Anthropic 實務）

1. **Library & API Reference（函式庫 / API 參考）**  
   用於內部 library、CLI、SDK 的用法與陷阱整理。

2. **Product Verification（產品驗證）**  
   用 Playwright / tmux 等工具做端到端驗證與斷言。

3. **Data & Analysis（資料與分析）**  
   管理查詢方式、欄位定義、監控儀表板定位方法。

4. **Business Automation（業務自動化）**  
   把重複流程封裝成一個指令（例：站會、週報、開票流程）。

5. **Scaffolding & Templates（腳手架與範本）**  
   產生符合團隊規範的程式碼骨架與模板。

6. **Code Quality & Review（程式碼品質與審查）**  
   落實審查策略、測試慣例、風格一致性與缺陷檢查。

7. **CI/CD & Deployment（CI/CD 與部署）**  
   把提交、部署、回滾、合併流程標準化。

8. **Incident Runbooks（運行手冊）**  
   從症狀出發，導向調查路徑，最後產出結構化報告。

9. **Infrastructure Ops（基礎設施運維）**  
   針對可能破壞性的維運流程加上保護機制與確認步驟。

> 判斷法：如果一個 skill 同時卡在多類別，先拆小再說。

---

## 製作 Skills 的九個進階技巧（含範例）

以下每條：**原則** → **為什麼** → **範例（好 / 壞對照或情境）**。

---

### 1. 不要寫 Claude 本來就知道的事

**原則**：Skill 裡只放「能把模型從預設思維推開」的資訊——專案慣例、內部 API、反直覺邊界、你們踩過的坑。

**為什麼**：Claude 對一般程式設計與常見函式庫已有預設知識；重複寫教科書內容只佔 context、訊號低。

**範例**：

- **較無用**：「用 `fetch` 發 HTTP 請求時要處理 async/await。」（模型本來就會。）
- **較有用**：「我們的 `billing-lib` 在 test mode 會跳過 webhook；退款必須傳 **charge ID**，不能傳 invoice ID。」
- **Anthropic 內部類比**：`frontend-design` 這類 skill 專注在「避免 Inter + 紫色漸層」等你們要的設計品味，而不是教什麼叫 CSS。

---

### 2. 永遠維護 Gotchas 區塊

**原則**：在 `SKILL.md`（或 `ref/`）固定留一區 **Gotchas**；每次模型或人踩坑就加一行。

**為什麼**：實務上 **訊號密度最高** 的往往就是這幾條；它們是從真實失敗累積出來的，比泛泛的「使用說明」更值。

**範例（同一個 billing skill 的演進）**：

| 時間 | Gotchas 長什麼樣子 |
|:-----|:-------------------|
| 第 1 天 | 「用法見內部 lib README。」（幾乎沒陷阱資訊。） |
| 第 2 週 | 「Proration **向下取整**，不是四捨五入到分。」 |
| 第 3 個月 | 「test-mode 會跳過 hook」「冪等鍵 24h 過期」「退款要 charge ID 不是 invoice ID」… |

**寫法提示**：一行一條、可掃描；必要時加「錯誤徵兆 → 正確做法」。

---

### 3. 用資料夾做漸進式揭露

**原則**：Skill 是**整個資料夾**，不是單一長篇 Markdown。`SKILL.md` 當 **hub**（約 30～50 行），依主題拆到子檔，需要時再讀。

**為什麼**：等於在做 **context engineering**：先給路由表，再按需載入細節，避免一次塞滿無關內容。

**範例（queue-debugging 類 skill 的結構）**：

```text
queue-debugging/
  SKILL.md           # hub：依症狀指到下面哪一個檔
  stuck-jobs.md
  dead-letters.md
  retry-storms.md
  consumer-lag.md
```

`SKILL.md` 內可能只寫：「Jobs 卡住 → 讀 `stuck-jobs.md`；進 DLQ → `dead-letters.md`…」

**其他常見拆法**：

- 詳細 API 簽名與範例 → `ref/api.md`
- 輸出報告要複製的版型 → `assets/report-template.md`

---

### 4. 不要把步驟寫死

**原則**：寫 **目標 + 約束 + 成功條件**，不要寫成機械式的「Step 1 打這行指令、Step 2 打那行…」到每個微動作。

**為什麼**：Skill 要可重用；情境一變，死步驟反而讓模型不敢偏離或做錯順序。

**範例**：

**❌ 過細（不推薦）**：

```text
Step 1: 執行 git log 找 commit。
Step 2: 執行 git cherry-pick <hash>。
Step 3: 若有衝突則 git status…
Step 4: 開啟每個衝突檔…
Step 5: 對每個 <<< 標記決定保留哪一邊…
```

**✅ 較好**：

```text
在乾淨分支上 cherry-pick 指定 commit；解衝突時保留原意。
若無法乾淨合入，說明阻礙原因與建議下一步。
```

模型仍會用 `git`，但可依 repo 態選擇最短路徑。

---

### 5. description 是給模型判斷觸發用的

**原則**：`description`（或對應中繼資料）應寫 **「什麼使用者話題 / 指令會啟用這個 skill」**，不是寫行銷式功能簡介。

**邊界**：語氣、篇幅、必用工具、互動流程等屬於「載入後怎麼做」，寫在 `SKILL.md` 正文或 `ref/`；塞進 `description` 會讓模型把「選 skill」與「執行規範」混在一起，且觸發欄位變冗長。

**為什麼**：Claude Code 會掃描「技能清單 + 描述」來決定要不要載入這個 skill；寫得像產品說明書，觸發率會很差。

**範例**：

**❌ 較差**：

```text
A comprehensive tool for monitoring pull request status across the development lifecycle.
```

**✅ 較好**：

```text
Monitors a PR until it merges. Loads when the user mentions babysitting a PR, watching CI, or making sure a change lands.
```

可內化成習慣：在 `description` 裡**列出口語關鍵字／情境**，讓模型知道何時載入。

---

### 6. 首次設定用 `config.json`

**原則**：依使用者環境而變的設定（頻道、範本、預設專案名等），**第一次**執行時問清楚，寫入 skill 目錄下的 `config.json`；之後直接讀檔，不再重問。

**為什麼**：把「互動成本」集中在首次設定，後續執行穩定、可重現。

**範例（standup-post 類 skill）**：

1. 觸發詞含 `standup` / `daily` 時啟用。
2. 若 **沒有** `config.json`：問使用者「要發到哪個 Slack 頻道？」「貼一則你滿意的站會範本。」
3. 把答案寫進 `config.json`。
4. 若 **已有** `config.json`：直接依儲存的頻道與格式產出站會內容。

（若平台支援，也可用結構化問答工具如 AskUserQuestion。）

**`config.json` 示意**：

```json
{
  "slack_channel": "#engineering-standup",
  "template_markdown": "## Yesterday / Today / Blockers\n- ..."
}
```

---

### 7. 用持久路徑儲存「記憶」與執行歷史

**原則**：需要在多次執行之間保留的 log / 狀態，放在 **穩定、升級 skill 不會被清掉** 的路徑；Anthropic 慣例是用 **`${CLAUDE_PLUGIN_DATA}`**。

**為什麼**：存在「純 skill 目錄內」的檔案，在 skill 目錄被替換或發佈流程升級時可能被覆蓋或重置。

**範例（standup-post + 記憶）**：

- 在 skill 說明裡寫：每次發完站會後，把內容 **append** 到 `${CLAUDE_PLUGIN_DATA}/standups.log`。
- 下次執行時 **先讀** 該 log（例如看昨天寫了什麼），再產出「相對於昨天的變化」，避免重複或矛盾。

**其他儲存形態**：純文字 log、JSON 行檔、甚至 SQLite——依複雜度選。

---

### 8. 給可組合的程式碼，不要只給「敘述式樣板」

**原則**：在 skill 裡提供 **小函式、小腳本、可查表的常數**，讓模型 **import / 複製後組裝**，而不是從零重建一整段樣板程式。

**為什麼**：節省 token 與回合數，錯誤率下降；業務邏輯留在「你寫好的正確片段」裡。

**範例（資料分析類 skill）**：

在文件或 `scripts/` 裡約定好：

- `fetch(day)`：從 `events_raw` 拉某日註冊資料；**必須**用 `signup_completed`；去重用 `anonymous_id`。
- `by_referrer(df)`：依流量來源分群（直接流量、空值、`None` 一律視為 organic）。
- `by_landing_page(df)`：首頁多種 URL 要合併；去掉 query string。

使用者問「週二發生什麼事？」時，模型會傾向 **組一個腳本**：拉週一 vs 週二、`by_referrer` / `by_landing_page` 比對，而不是重寫一套你已在 skill 裡定義過的規則。

---

### 9. 按需掛鉤（On-Demand Hooks）

**原則**：有些 **防護或限制** 不該 24/7 全域開著，只在「這次工作階段我確定需要」時啟用——可用 **僅在呼叫某 skill / 某指令時啟用、並在整個 session 持續** 的 hook。

**為什麼**：全域阻擋（例如擋掉所有危險 bash）可能造成日常開發煩躁；按需開關在碰 prod、大改動時再開。

**範例**：

| 指令 / 情境 | 行為 |
|:------------|:-----|
| **`/careful`** | 透過 PreToolUse 等 matcher，在 Bash 上擋 `rm -rf`、`DROP TABLE`、force-push、`kubectl delete` 等。只在自知在碰敏感環境時啟用。 |
| **`/freeze`** | 擋下「寫入不在指定目錄內的檔案」。適合 debug：「我只想加 log，不要一直改到不相干的檔。」 |

實作細節依 Claude Code / 外掛對 hooks 的支援方式而定；重點是 **「會話範圍 + 有意識開啟」**，不是預設綁死所有行為。

---

## 團隊分發與治理（避免技能污染）

- **小團隊**：可先把 skill 直接簽入 repo（如 `**/skills/` 目錄）。  
- **大團隊**：建議用中央化的 skills 倉庫（單一 repo 或內部 registry），由成員同步或子目錄引用，並搭配審核流程。  
- **關鍵不是平台，而是策展**：要有提交、審核、淘汰機制，避免重複與低品質 skill 泛濫。

---

## 可直接套用的實作模板（精簡版）

### 1) `SKILL.md` 寫法骨架

- 目的（這個 skill 解決哪一種任務）
- Trigger 條件（描述中要看得到）
- 輸入 / 輸出定義
- 約束與邊界（不要寫死步驟）
- Gotchas（初版可先 1~3 條）
- 參考檔案導覽（`ref/`、`assets/`、`scripts/`）

### 2) 建議目錄結構

```text
<skill-name>/
  SKILL.md
  config.json                 # 首次設定後寫入
  ref/
    api.md
    examples.md
  assets/
    output-template.md
  scripts/
    validate.sh
  memory/
    # 若平台允許，改存到 ${CLAUDE_PLUGIN_DATA}
```

---

## 最後結論

最實用的策略不是追求「一次完美」，而是：

1. 先做最小可用 skill。  
2. 每次失敗補 Gotcha。  
3. 持續拆分、組合與治理。  

這樣 skill 會從「能用」變成「團隊真的想一直用」。
