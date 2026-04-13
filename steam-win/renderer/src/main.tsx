import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/noto-sans-tc/400.css';
import '@fontsource/noto-sans-tc/700.css';
import '@fontsource/noto-sans-tc/900.css';
import App from './App.tsx';
import './index.css';

/**
 * DEV：`levelData/index.ts` 用 `import.meta.glob(..., { eager: true })` 打包地圖 JSON 時，
 * 單獨改 `maps/*.json` 常不會讓該模組重跑，記憶體仍是舊幾何。啟動時改從 Vite 以 fetch 載入
 * 磁碟最新 `levels.json` + 各 map，與標題列「重讀 JSON」同一路徑。
 */
async function maybeDevBootstrapLevelsFromDisk(): Promise<void> {
  if (!import.meta.env.DEV) return;
  const { devReloadLevelsFromJson } = await import('./dev/reloadLevelsJson');
  const r = await devReloadLevelsFromJson();
  if (!r.ok) {
    console.warn('[dev] 關卡／地圖自磁碟載入失敗，沿用打包內建資料：', r.error);
  }
}

void maybeDevBootstrapLevelsFromDisk().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
