# 九類分類 + 九個技巧（必守）

這份內容是 `skill-writing-guide/SKILL.md` 的細節承接檔。

---

## 九類分類（一個 skill 對應一類）

| 類別 | 說明 |
|------|------|
| **Library & API Reference** | 函式庫/CLI/SDK 用法與陷阱 |
| **Product Verification** | 驅動產品做驗證（Playwright、tmux 等） |
| **Data & Analysis** | ID、欄位、查詢模式、儀表板 |
| **Business Automation** | 多工具工作流，一指令搞定 |
| **Scaffolding & Templates** | 框架正確的樣板程式碼 |
| **Code Quality & Review** | 程式碼品質與審查方法 |
| **CI/CD & Deployment** | 提交、推送、安全部署 |
| **Incident Runbooks** | 症狀 → 調查 → 報告 |
| **Infrastructure Ops** | 安全把關的清理與維護 |

若一個 skill 橫跨多類，考慮拆開。

---

## 九個技巧（必守）

1. **別寫顯而易見的事**
   - Claude 對程式與程式庫已有預設。
   - Skill 只寫「能把 Claude 從常規推開」的資訊（專案慣例、你們的陷阱）。

2. **Gotchas 區塊**
   - 每個 skill 要有 `Gotchas` 區塊，隨 Claude 或人踩坑持續補一條。
   - 訊號密度最高的往往是這些注意事項。

3. **漸進式揭露（Skill 是資料夾）**
   - Skill 不只一個 `.md`。
   - 用 `SKILL.md` 當 hub（約 30～50 行），細節放到 `ref/*.md` 或 `assets/`。
   - 在 hub 裡註明「見 ref/xxx」，需要時再讀子檔。

4. **不要寫死步驟**
   - 寫「目標 + 約束 + 成功條件」，不寫機械式的「Step 1/2/3」到每個微動作。
   - 給彈性讓模型依情境選工具與順序。

5. **description = 觸發條件**
   - `description` 是給模型判斷「**要不要載入**這個 skill」用的，不是執行說明書。
   - 直接寫**情境／關鍵詞**（繁中可）：例如「使用者要下載遠端 skill」「比對預存與 gorm column」。**不要**加 `Trigger on:`、`Trigger on：` 等前綴——語意已在「何時載入」，前綴只佔 token、與正文「觸發時機」重複。
   - 亦可接受「何時用：...」句式；避免功能摘要、行銷式一句話介紹。
   - **不要**把「載入後怎麼表現」寫進 `description`（例：回應須簡潔、一律用 `AskQuestion`、語氣／篇幅規則）——與觸發條件分開：短條列放 frontmatter **`constraints:`**（**獨立欄位**），較長說明放 `SKILL.md` 正文或 `ref/`。

6. **首次設定用 `config.json`**
   - 若 skill 需要使用者情境（例如要發到哪個頻道），第一次執行時問完寫進 skill 目錄的 `config.json`，之後直接讀。

7. **記憶用穩定目錄**
   - 要存執行歷史時用 `${CLAUDE_PLUGIN_DATA}` 或約定好的穩定路徑，不要只存 skill 目錄（升級時可能被清掉）。

8. **給可組合的程式碼**
   - 提供可複製的片段、範本、一鍵指令，讓模型「組合」而非從零重建一整段樣板程式。
   - 必要時在 `assets/` 放範例檔。

9. **按需掛鉤（可選）**
   - 若平台支援，可為「僅在此 skill 啟用時」的防護加 hook（例如阻擋 `rm -rf`、限定編輯目錄）。

---

## 實作檢查（快速）

- 資料夾與 frontmatter name 為 kebab-case（單字可保持不變）
- description 僅觸發詞／情境；**無** `Trigger on:` 前綴；執行約束在 **`constraints:`**（可選）或正文／`ref/`
- 有 `Gotchas` 區塊（可先留空，踩坑就補）
- 若內容多，拆成 hub + `ref/` 或 `assets/`，做漸進式揭露
- 指令寫目標與約束，不寫死 Step 1/2/3
- 不寫 Claude 本來就會的；只寫專案/團隊特有
- 有可複製的程式碼或範本時，放在內文或 `assets/`

---

## 審查多個 skill

見同目錄 **`review-workflow.md`**（兩階段：批次掃描 → 按需深讀）。

---

## 完成後給使用者的簡報

新建或優化完稿時如何標**主九類**與**技巧編號**：見 **`user-facing-summary.md`**。
