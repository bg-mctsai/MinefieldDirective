import {
  logicNeighborKeys,
  neighborModeForGridSystem,
  type NeighborMode,
} from '../levelData/gridTopology';
import {
  MineSolver,
  mergeTopologyWithDynamicMines,
  mineSolverTopologyFromLevel,
} from '../gameLogic';
import { placementsForSolver } from './fortifyModule';
import type { GameState } from './types';

export type BobbyPlaceHintCell = { x: number; y: number };

/** 自上一手落點起算的最大邏輯步數（方格≈切比雪夫 1 格；蜂巢為六邊 1 步） */
export const BOBBY_PLACE_HINT_MAX_DIST = 1;

/** 波比：同一組長官電報內，第一格落穩後（placedInTurn≥1）選第二道電碼時顯示嗅線 */
export function isBobbySniffTurn(placedInTurn: number): boolean {
  return placedInTurn >= 1;
}

const cellKey = (x: number, y: number) => `${x},${y}`;

/** 與 handleCellClick 相同：可佈數字的空格 */
export function isDeployableCellKey(
  key: string,
  placedKeys: ReadonlySet<string>,
  revealedMines: ReadonlySet<string>,
  dynamicMines: ReadonlySet<string>,
  blastPointKeys: ReadonlySet<string>,
  validKeys: ReadonlySet<string>,
): boolean {
  if (!validKeys.has(key)) return false;
  if (placedKeys.has(key)) return false;
  if (revealedMines.has(key)) return false;
  if (dynamicMines.has(key)) return false;
  if (blastPointKeys.has(key)) return false;
  return true;
}

function keysWithinLogicDistance(
  anchorX: number,
  anchorY: number,
  maxDist: number,
  validKeys: Set<string>,
  mode: NeighborMode,
  boardW: number,
  boardH: number,
): Set<string> {
  const zone = new Set<string>();
  if (maxDist <= 0) return zone;

  if (mode === 'MOORE') {
    for (const k of validKeys) {
      const comma = k.indexOf(',');
      const x = Number(k.slice(0, comma));
      const y = Number(k.slice(comma + 1));
      const d = Math.max(Math.abs(x - anchorX), Math.abs(y - anchorY));
      if (d > 0 && d <= maxDist) zone.add(k);
    }
    return zone;
  }

  const start = cellKey(anchorX, anchorY);
  const queue: { x: number; y: number; d: number }[] = [{ x: anchorX, y: anchorY, d: 0 }];
  const seen = new Set<string>([start]);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.d >= maxDist) continue;
    const nextD = cur.d + 1;
    for (const nk of logicNeighborKeys(cur.x, cur.y, validKeys, mode, boardW, boardH)) {
      if (seen.has(nk)) continue;
      seen.add(nk);
      if (nextD <= maxDist) zone.add(nk);
      const comma = nk.indexOf(',');
      queue.push({ x: Number(nk.slice(0, comma)), y: Number(nk.slice(comma + 1)), d: nextD });
    }
  }
  return zone;
}

/** 與落格一致：鄰位已佈數字時，實際寫入值 = 電碼 + 鄰格加成 */
function placementValueForCell(
  x: number,
  y: number,
  telegramValue: number,
  level: GameState['level'],
  placedNumbers: GameState['placedNumbers'],
): number {
  if (!level.definition.neighborPlacedDigitBonus) return telegramValue;
  const validKeys = new Set(level.cells.map((c) => `${c.x},${c.y}`));
  const nMode = neighborModeForGridSystem(level.definition.gridSystem);
  const placedKeySet = new Set(placedNumbers.map((p) => `${p.x},${p.y}`));
  const neighborKeys = logicNeighborKeys(x, y, validKeys, nMode, level.width, level.height);
  let bonus = 0;
  for (const nk of neighborKeys) {
    if (placedKeySet.has(nk)) bonus += 1;
  }
  return telegramValue + bonus;
}

function solverTopologyForHints(
  level: GameState['level'],
  dynamicMines: ReadonlySet<string>,
  blastPointKeys: ReadonlySet<string>,
) {
  const baseTopo = mineSolverTopologyFromLevel(level);
  const mineTopo = mergeTopologyWithDynamicMines(baseTopo, new Set(dynamicMines));
  return {
    ...mineTopo,
    forcedMineKeys: new Set<string>([
      ...(mineTopo.forcedMineKeys ?? new Set<string>()),
      ...blastPointKeys,
    ]),
  };
}

/**
 * 波比：嗅線回合且已選電碼時，標出上一手鄰格內「放當前電碼不會爆」的可佈空格。
 */
export function computeBobbyPlaceHints(
  anchorX: number,
  anchorY: number,
  telegramValue: number,
  level: GameState['level'],
  placedNumbers: GameState['placedNumbers'],
  revealedMines: ReadonlySet<string>,
  dynamicMines: ReadonlySet<string>,
  blastPointKeys: ReadonlySet<string>,
  maxDist: number = BOBBY_PLACE_HINT_MAX_DIST,
): BobbyPlaceHintCell[] {
  const validKeys = new Set(level.cells.map((c) => `${c.x},${c.y}`));
  const placedKeys = new Set(placedNumbers.map((p) => `${p.x},${p.y}`));
  const mode = neighborModeForGridSystem(level.definition.gridSystem);
  const zoneKeys = keysWithinLogicDistance(
    anchorX,
    anchorY,
    maxDist,
    validKeys,
    mode,
    level.width,
    level.height,
  );
  const topo = solverTopologyForHints(level, dynamicMines, blastPointKeys);

  const marks: BobbyPlaceHintCell[] = [];
  for (const key of zoneKeys) {
    if (
      !isDeployableCellKey(key, placedKeys, revealedMines, dynamicMines, blastPointKeys, validKeys)
    ) {
      continue;
    }
    const [x, y] = key.split(',').map(Number);
    const value = placementValueForCell(x, y, telegramValue, level, placedNumbers);
    const testPlaced = [...placementsForSolver(placedNumbers), { x, y, value }];
    const solver = new MineSolver(level.cells, testPlaced, topo);
    if (!solver.isValid()) continue;
    marks.push({ x, y });
  }
  marks.sort((a, b) => a.y - b.y || a.x - b.x);
  return marks;
}
