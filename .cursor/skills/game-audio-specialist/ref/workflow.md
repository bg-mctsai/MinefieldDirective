# 音效整理工作流（全專案）

## Step 0: 定義盤點範圍

- 先切批次：例如 `chapter-01`、`ui-system`、`combat-core`。
- 每批次限定可處理檔案量，避免一次動太多難回歸。

## Step 1: 掃描與建表

- 掃描檔案後建立盤點欄位：
  - `asset_id`
  - `filename`
  - `category`
  - `event_key`
  - `source`
  - `license`
  - `status`（`ready` / `needs-fix` / `blocked`）
  - `notes`

## Step 2: 授權門檻

- 來源不明、license 不清楚、禁止商用 -> `blocked`。
- 需要署名的素材，必須在遊戲 credits 有對應條目。

## Step 3: 命名整併

- 先建立映射表：舊檔名 -> 新檔名。
- 確認程式內事件 key 不變，避免 runtime 找不到音檔。
- 批次改名後立刻跑一次引用檢查。

## Step 4: 技術驗收

- 格式一致（建議 SFX 源檔 48kHz/24-bit WAV）。
- 峰值與響度檢查（避免 clipping 與過度忽大忽小）。
- 針對循環音（ambience）檢查 loop click/pop。

## Step 5: 遊戲內驗證

- 只選高風險場景先測：主戰鬥、UI 連點、過場切換。
- 記錄問題類型：太吵、太尖、辨識度低、優先權被蓋掉。

## Step 6: 回寫規範

- 把本批次決策（命名、分類、音量策略）回寫到規範檔。
- 下批次只能沿用，不可臨時改口徑。
