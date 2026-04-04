import { applyReloadedLevelDefinitionsJson } from '../levelData';
import { LEVELS, rebuildPlayableLevelsFromDefinitions } from '../gameLogic';

/**
 * 開發模式：向 Vite 重新 fetch `levels.json` 並套用（不需重啟 Electron）。
 * 正式打包後不應呼叫（無對應 URL）。
 */
export async function devReloadLevelsFromJson(): Promise<
  { ok: true; levelCount: number } | { ok: false; error: string }
> {
  try {
    const base = new URL('../levelData/levels.json', import.meta.url).href;
    const res = await fetch(`${base}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return { ok: false, error: `讀取失敗 HTTP ${res.status}` };
    const raw: unknown = await res.json();
    applyReloadedLevelDefinitionsJson(raw);
    rebuildPlayableLevelsFromDefinitions();
    return { ok: true, levelCount: LEVELS.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
