/**
 * 測試／開發捷徑總開關（預設關閉）。
 * 僅非 production 且 `steam-win/.env.local` 設 `VITE_DEV_TOOLS=1` 時啟用：
 * - 首頁「重讀設定」、啟動時自磁碟載入關卡
 * - 行動卷宗／幹員檔案「測試 · 開放全部」切換
 * - 對局「測試完成」捷徑
 *
 * 另見 `VITE_UNLOCK_ALL_LEVELS=1`（永久全關解鎖，無 UI）。
 */
export const DEV_TOOLS_ENABLED =
  !import.meta.env.PROD && import.meta.env.VITE_DEV_TOOLS?.trim() === '1';
