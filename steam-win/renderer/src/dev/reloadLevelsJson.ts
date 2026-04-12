import {
  applyReloadedLevelDefinitionsJson,
  parseLevelsJsonStored,
  type MapLayout,
} from '../levelData';
import { LEVELS, rebuildPlayableLevelsFromDefinitions } from '../gameLogic';

/**
 * 開發模式：向 Vite 重新 fetch `levels.json` 與用到的 `maps/*.json` 並套用（不需重啟 Electron）。
 * 正式打包後不應呼叫（無對應 URL）。
 */
export async function devReloadLevelsFromJson(): Promise<
  { ok: true; levelCount: number } | { ok: false; error: string }
> {
  try {
    const t = Date.now();
    const levelsUrl = new URL('../levelData/levels.json', import.meta.url).href;
    const res = await fetch(`${levelsUrl}?t=${t}`, { cache: 'no-store' });
    if (!res.ok) return { ok: false, error: `讀取失敗 HTTP ${res.status}` };
    const raw: unknown = await res.json();
    const stored = parseLevelsJsonStored(raw);
    const refs = new Set<string>();
    for (const L of stored) {
      if (L.mapLayout == null && L.mapRef != null && L.mapRef !== '') refs.add(L.mapRef);
    }
    const mapLayoutsByRef: Record<string, MapLayout> = {};
    await Promise.all(
      [...refs].map(async (ref) => {
        const href = new URL(`../levelData/maps/${ref}.json`, import.meta.url).href;
        const mr = await fetch(`${href}?t=${t}`, { cache: 'no-store' });
        if (!mr.ok) throw new Error(`地圖 maps/${ref}.json HTTP ${mr.status}`);
        const payload: unknown = await mr.json();
        const ml =
          payload && typeof payload === 'object' && 'mapLayout' in payload
            ? (payload as { mapLayout: MapLayout }).mapLayout
            : undefined;
        if (ml == null) throw new Error(`maps/${ref}.json 缺少 mapLayout`);
        mapLayoutsByRef[ref] = ml;
      })
    );
    applyReloadedLevelDefinitionsJson(raw, refs.size ? mapLayoutsByRef : undefined);
    rebuildPlayableLevelsFromDefinitions();
    return { ok: true, levelCount: LEVELS.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
