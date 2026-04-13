---
name: skill-writing-guide
description: >-
  建立或編輯 `**/skills/**`；優化、改進或重構 skill；審查或批次盤點 skill 品質；詢問 skill 寫作規範，或如何檢查／改進其他 skill。
constraints:
  - 回應須簡潔。
updated: 2026-04-10T13:07:20+08:00

---

# Skill 撰寫與改進指南（Anthropic 風格）

建立、編輯或**優化** skill 時：**先最小可用**，再用 **`Gotchas` 迭代**。審查多個 skill 時：**先批次掃描、再按需深讀**（見 `ref/review-workflow.md`），不要預設每個都全文讀完。

## 建立／優化完成後（必做：給使用者的簡報）

完稿時在回覆中**明確告知**：（1）此 skill 的**主九類**（`ref/nine-techniques.md` 表內英文名）；（2）**本次採用**哪些撰寫／優化手段（對應九技巧的**編號 1～9**，未動者不列）。範本與對照表：`ref/user-facing-summary.md`。批次審查時摘要表同樣可加上主類與手段欄。

## 漸進式揭露（Skill 是資料夾）

- `SKILL.md` 只當 hub：短句路由到細節（建議 **30～50 行**）
- 九類 + 九技巧 + 實作檢查細項：`ref/nine-techniques.md`
- **完成後簡報**（主類別 + 技巧編號）：`ref/user-facing-summary.md`
- **審查其他 skill 的流程**（兩階段、是否逐個檢查）：`ref/review-workflow.md`
- 更長範例與說明：`anthropic-claude-code-skills-core.md`

## Gotchas（必保留）

- 建立／優化完稿卻**未**向使用者標明**主九類**與**採用技巧編號**（見 `ref/user-facing-summary.md`）
- 忘記在 `SKILL.md`/`ref/` 留 **`Gotchas`**，踩坑無法累積
- 把 `description` 寫成功能摘要、行銷句，而不是「觸發詞／何時載入」；或在 `description` 加 `Trigger on:`／`Trigger on：` 等**前綴**（應直接寫觸發句，見 `ref/nine-techniques.md` 技巧 5）
- 把**執行時約束**（例：回應須簡潔、必用某工具、語氣規則）塞進 `description`——應改到 **`constraints`**（frontmatter **獨立欄位**、短條列）或 `SKILL.md` 正文／`ref/`（較長），否則混淆「要不要載入」與「載入後怎麼做」
- 沒做 hub + `ref/`，單檔塞滿，模型難路由
- `sync_skill.py` 每次複製後會在遠端 clone 的 `SKILL.md` frontmatter **寫入／更新 `updated`（台灣時間 `+08:00`，附在 frontmatter 最末、`description` 之後）**，故多數發佈至少會動到 `SKILL.md`；僅在無 `SKILL.md` 或 stamp 後仍無 diff 時才會因 `git status` 為空而跳過、不建 PR

## 優化其他 skill 時（優化內容優先）

- **直接搬運**本指南已落地的寫法：`Gotchas`、hub + `ref/`、目標 + 約束（不寫死逐步微操）
- **落地到欄位**：不只講原則；要改出具體段落、`description` 觸發詞、`ref/` 導覽
- 若已有 `Gotchas` / hub + `ref/`：**只補缺與修衝突**，避免整包改風格

## 實作檢查（快速）

- 資料夾 kebab-case、`name:` 與資料夾一致
- `description` 僅觸發／情境（何時載入），**不要** `Trigger on:` 前綴；**執行約束**與 `description` **分開敘述**：短句用 frontmatter **`constraints:`** 條列，較長說明放正文或 `ref/`
- 內容寫專案特有，不重述模型預設已知
- 有可複製片段／範本：內文或 `assets/`、`scripts/`
