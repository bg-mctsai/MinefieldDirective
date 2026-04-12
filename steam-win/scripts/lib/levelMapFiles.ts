/**
 * levels.json 與 levelData/maps/{mapRef}.json 的讀寫輔助（Node / tsx 腳本用）。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MapLayout } from '../../renderer/src/levelData/types';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const LEVELS_JSON_PATH = join(__dirname, '../../renderer/src/levelData/levels.json');
export const MAPS_DIR = join(__dirname, '../../renderer/src/levelData/maps');

export function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

export function getMapLayoutFromLevel(level: {
  levelId: number;
  mapLayout?: MapLayout;
  mapRef?: string;
}): MapLayout {
  if (level.mapLayout != null) return level.mapLayout;
  if (level.mapRef == null || level.mapRef === '') {
    throw new Error(`關卡 ${level.levelId} 缺少 mapLayout 或 mapRef`);
  }
  const p = join(MAPS_DIR, `${level.mapRef}.json`);
  if (!existsSync(p)) throw new Error(`找不到地圖檔：${p}`);
  const raw = readJsonFile(p) as { mapLayout?: MapLayout };
  if (raw.mapLayout == null) throw new Error(`${p} 缺少 mapLayout`);
  return raw.mapLayout;
}

export function setMapLayoutOnLevel(
  level: { mapRef?: string; mapLayout?: MapLayout },
  mapLayout: MapLayout
): void {
  if (level.mapRef != null && level.mapRef !== '') {
    if (!existsSync(MAPS_DIR)) mkdirSync(MAPS_DIR, { recursive: true });
    const p = join(MAPS_DIR, `${level.mapRef}.json`);
    let mapTheme: string | undefined;
    if (existsSync(p)) {
      const prev = readJsonFile(p) as { mapTheme?: unknown };
      if (typeof prev.mapTheme === 'string' && prev.mapTheme.trim() !== '') {
        mapTheme = prev.mapTheme.trim();
      }
    }
    const payload = mapTheme != null ? { mapLayout, mapTheme } : { mapLayout };
    writeFileSync(p, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } else {
    level.mapLayout = mapLayout;
  }
}
