/**
 * 依 levelDefinitionsFactory 邏輯輸出 100 關 JSON。
 * 執行：npm run export-levels-json（專案根目錄 steam-win）
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLevelDefinition } from '../renderer/src/levelData/levelDefinitionsFactory.ts';
import { PLANNER_FIELD_DOCS } from '../renderer/src/levelData/plannerFieldDocs.ts';
import type { MapCloudOverlayConfig } from '../renderer/src/levelData/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../renderer/src/levelData/levels.json');

/** 重新產生關卡時保留企劃在 levels.json 手動維護的各章首戰台詞 */
function loadPreviousChapterBriefings(): Map<number, string[]> {
  const map = new Map<number, string[]>();
  if (!existsSync(outPath)) return map;
  try {
    const raw = JSON.parse(readFileSync(outPath, 'utf8')) as { levels?: { levelId: number; chapterEntryBriefing?: string[] }[] };
    for (const l of raw.levels ?? []) {
      if (Array.isArray(l.chapterEntryBriefing) && l.chapterEntryBriefing.length > 0) {
        map.set(l.levelId, l.chapterEntryBriefing);
      }
    }
  } catch {
    /* 略過損毀的舊檔 */
  }
  return map;
}

/** 保留手動編輯的 mapCloudOverlay（與 factory 預設分離） */
function loadPreviousMapCloudOverlays(): Map<number, MapCloudOverlayConfig> {
  const map = new Map<number, MapCloudOverlayConfig>();
  if (!existsSync(outPath)) return map;
  try {
    const raw = JSON.parse(readFileSync(outPath, 'utf8')) as {
      levels?: { levelId: number; mapCloudOverlay?: MapCloudOverlayConfig }[];
    };
    for (const l of raw.levels ?? []) {
      const c = l.mapCloudOverlay;
      if (c != null && typeof c === 'object') map.set(l.levelId, c);
    }
  } catch {
    /* 略過損毀的舊檔 */
  }
  return map;
}

const prevBriefings = loadPreviousChapterBriefings();
const prevClouds = loadPreviousMapCloudOverlays();
const levels = Array.from({ length: 100 }, (_, i) => {
  const def = createLevelDefinition(i + 1);
  const b = prevBriefings.get(def.levelId);
  const cloud = prevClouds.get(def.levelId);
  const next = { ...def };
  if (b) next.chapterEntryBriefing = b;
  if (cloud) next.mapCloudOverlay = cloud;
  return next;
});
const payload = { _企劃欄位說明: PLANNER_FIELD_DOCS, levels };
writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Wrote ${levels.length} levels + planner docs -> ${outPath}`);
