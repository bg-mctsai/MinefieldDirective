/**
 * 全域移除 TRIANGLE 玩法（可重跑）
 *
 * - 所有 TRIANGLE 關卡：
 *   - Chapter 4 -> SQUARE（降低入門心智負擔）
 *   - 其他章節 -> HEXAGON（保留高壓鄰接）
 * - 同步重算節奏：
 *   - SQUARE: timeLimit * 0.90, coverageGoal - 0.02
 *   - HEXAGON: timeLimit * 1.06, coverageGoal + 0.01
 * - 同步清理關卡標題與 mapTheme 的三角意象用詞
 *
 * 執行（cwd=steam-win）:
 *   npx tsx scripts/patch-remove-triangle-gameplay.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HexagonMapLayout, LevelDefinitionStored, MapLayout, SquareMapLayout } from '../renderer/src/levelData/types';

/** 舊版 mapLayout（型別已自 renderer 移除，遷移腳本專用） */
type LegacyTriangleMapLayout = {
  type: 'TRIANGLE';
  placeholder: { width: number; height: number };
  forbiddenCells?: [number, number][];
};
import {
  getMapLayoutFromLevel,
  LEVELS_JSON_PATH,
  MAPS_DIR,
  readJsonFile,
  setMapLayoutOnLevel,
} from './lib/levelMapFiles.ts';

type LevelsRoot = { levels: LevelDefinitionStored[] };
type MapFile = { mapLayout: MapLayout; mapTheme?: string };

const RAW = JSON.parse(readFileSync(LEVELS_JSON_PATH, 'utf8')) as LevelsRoot;

const clampCoverage = (v: number) => Math.max(0.6, Math.min(0.92, Math.round(v * 100) / 100));
const normalizeTitle = (s: string) => s.replaceAll('三角高地', '稜線高地').replaceAll('三角', '稜線');
const normalizeTheme = (s: string) => s.replaceAll('三角', '稜線');

function toSquare(layout: LegacyTriangleMapLayout): SquareMapLayout {
  return {
    type: 'SQUARE',
    width: layout.placeholder.width,
    height: layout.placeholder.height,
    forbiddenCells: layout.forbiddenCells,
  };
}

function toHex(layout: LegacyTriangleMapLayout): HexagonMapLayout {
  return {
    type: 'HEXAGON',
    placeholder: { ...layout.placeholder },
    forbiddenCells: layout.forbiddenCells,
  };
}

let touched = 0;
const changedLevelIds: number[] = [];

for (const level of RAW.levels) {
  const mapPath = level.mapRef ? join(MAPS_DIR, `${level.mapRef}.json`) : null;
  const sourceLayout = getMapLayoutFromLevel(level) as MapLayout | LegacyTriangleMapLayout;
  if (sourceLayout.type !== 'TRIANGLE') continue;

  const tri = sourceLayout;
  const targetGrid = level.chapter === 4 ? 'SQUARE' : 'HEXAGON';
  const nextLayout = targetGrid === 'SQUARE' ? toSquare(tri) : toHex(tri);
  setMapLayoutOnLevel(level, nextLayout);

  if (mapPath != null) {
    const prev = readJsonFile(mapPath) as MapFile;
    const nextTheme = prev.mapTheme ? normalizeTheme(prev.mapTheme) : undefined;
    const payload = nextTheme ? { mapLayout: nextLayout, mapTheme: nextTheme } : { mapLayout: nextLayout };
    writeFileSync(mapPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }

  const nextTime = targetGrid === 'SQUARE' ? Math.max(35, Math.round(level.timeLimit * 0.9)) : Math.round(level.timeLimit * 1.06);
  const nextCoverage = targetGrid === 'SQUARE'
    ? clampCoverage(level.coverageGoal - 0.02)
    : clampCoverage(level.coverageGoal + 0.01);

  level.timeLimit = nextTime;
  level.coverageGoal = nextCoverage;
  if (typeof level.title === 'string') level.title = normalizeTitle(level.title);

  touched += 1;
  changedLevelIds.push(level.levelId);
}

writeFileSync(LEVELS_JSON_PATH, `${JSON.stringify(RAW, null, 2)}\n`, 'utf8');
console.log(`Patched ${touched} TRIANGLE levels => mixed SQUARE/HEXAGON.`);
console.log(`Changed levelIds: ${changedLevelIds.join(', ')}`);
