---
name: commit-push-version
description: >-
  使用者要求 commit、push、提交、推送、發版 web demo，或依 cursorrules 撰寫 commit message 時載入。
  先遞增 HOME_APP_VERSION，再依專案格式 commit 並 push main（觸發 GitHub Pages Actions）。
constraints:
  - 僅在使用者明確要求 commit 或 push 時執行；不得主動提交。
  - 使用者要求 commit 即同時授權成功後一般 push；除非明確要求只 commit、不 push。
  - commit message 必須符合 ref/commit-message-format.md（同 repo cursorrules）。
  - 禁止 git config 變更、--no-verify、force push main。
updated: 2026-07-18T09:05:00+08:00
---

# Commit + Push（含版本遞增）

## 版本號

| 項目 | 路徑 |
|------|------|
| 顯示版本（首頁左上角） | `steam-win/renderer/src/home/constants.ts` → `HOME_APP_VERSION` |
| 格式 | `vMAJOR.MINOR.PATCH`（例 `v1.0.6`） |
| 預設遞增 | **patch +1**（`v1.0.6` → `v1.0.7`） |

```powershell
# repo 根目錄
node .cursor/skills/commit-push-version/scripts/bump-app-version.mjs
```

- 版本 bump **必須**與本次 commit 的其他變更一起提交。
- 使用者指定 minor/major 時，手動改 `constants.ts`，勿改腳本預設行為。

## Commit Message

格式全文：`ref/commit-message-format.md`（與根目錄 `cursorrules` 一致）。

**快速判斷**

| 情況 | 格式 |
|------|------|
| 單一元件／機制 | `[Title] 敘述`（同一行，50 字內，祈使語氣） |
| 跨多項不相干變更 | 第一行僅 `[Title]`；body `1. 2. 3.` 列點 |

**Title** = 繁體中文、對應程式碼範圍（例 `[行動卷宗]`、`[GitHub Pages]`、`[關卡資料]`）。

## 執行順序

1. **平行**取得狀態：`git status`、`git diff`（含 staged）、`git log -5 --oneline`
2. **遞增版本**：執行 `bump-app-version.mjs`（或手動改 patch）
3. **分析 diff**：判斷單一／多項格式，撰寫 commit message
4. **Stage**：`git add` 相關檔（含 `constants.ts`）；不提交 `.env`、secrets、`dist-renderer/`、`release/`
5. **Commit**（PowerShell 範例）：

```powershell
# 單一變更
git commit -m "[行動卷宗] 修正手機作戰地圖雙欄擠壓問題"

# 多項變更
git commit -m "[行動卷宗]" -m "1. 手機改單欄戰術地圖" -m "2. 強化卷宗卡片觸控" -m "3. 遞增 web demo 版本號"
```

6. **Push（commit 成功後自動執行）**：目前分支已有 upstream 時執行 `git push`；否則執行 `git push -u origin <目前分支>`。僅當使用者明確要求「只 commit、不 push」才略過。
7. **回報**：commit hash、新版本號、Actions 連結 `https://github.com/bg-mctsai/MinefieldDirective/actions`、試玩網址

## Push 後

- `main` push 會觸發 `.github/workflows/deploy-pages.yml` 自動部署 Pages
- 提醒使用者：手機測試需清快取；以首頁 **版本號** 確認是否載入新版

## Gotchas

- Windows PowerShell **不支援** bash HEREDOC；用 `-m` 多次或 here-string pipe `git commit -F -`
- 若 pre-commit hook 失敗：**不要** `--amend`；修問題後 **新 commit**
- 版本 bump 若為本次唯一變更，Title 用 `[版本號]`，敘述說明遞增原因
- commit 成功卻忘記 push；「commit」預設包含後續一般 push，不必再次詢問
- 使用者只說 push → 先確認有未 push 的 commit
