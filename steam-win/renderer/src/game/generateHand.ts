import { MineSolver, mergeTopologyWithDynamicMines, mineSolverTopologyFromLevel, type Level } from '../gameLogic';
import { placementsForSolver } from './laozhangFortify';
import type { PlacedNumber } from './types';
import type { SeededRng } from './seededRng';
import { shuffleWithRng } from './seededRng';
import { maxDigitForGrid } from './signalJamming';

function allowedValuesFromCommands(level: Level): number[] {
  const w = level.definition.commands.weights;
  const cap = maxDigitForGrid(level.definition.gridSystem);
  const nums = Object.entries(w)
    .filter(([, wt]) => wt > 0)
    .map(([k]) => parseInt(k, 10))
    .filter((n) => n >= 1 && n <= cap);
  const fallback = cap <= 6 ? [3, 4, 5, 6].filter((n) => n <= cap) : [3, 4, 5, 6, 7, 8];
  return nums.length ? nums : fallback;
}

function randomWeightedFromWeights(level: Level, rng: SeededRng): number {
  const { poolType, weights } = level.definition.commands;
  const entries = Object.entries(weights).filter(([, wt]) => wt > 0);
  if (entries.length === 0) return 4;

  if (poolType === 'RANDOM') {
    const pick = entries[rng.nextInt(entries.length)];
    return parseInt(pick[0], 10);
  }

  const totalWeight = entries.reduce((a, [, b]) => a + b, 0);
  let r = rng.next() * totalWeight;
  for (const [num, weight] of entries) {
    r -= weight;
    if (r <= 0) return parseInt(num, 10);
  }
  return parseInt(entries[entries.length - 1][0], 10);
}

function handSize(level: Level): number {
  return Math.min(5, Math.max(1, level.definition.commands.maxHand));
}

/** 產生下一組「長官電報」待辦電碼（含輕量解題採樣，避免全盤暴力） */
export function generateHand(
  level: Level,
  placedNumbers: PlacedNumber[],
  rng: SeededRng,
  dynamicMines?: Set<string>,
  /** 若傳入則覆寫關卡 JSON 的 commands.maxHand（例：艾達 4 選 2） */
  handSlotCount?: number,
): number[] {
  const allowed = allowedValuesFromCommands(level);
  const validNumbers = new Set<number>();
  const solverPlaced = placementsForSolver(placedNumbers);
  const emptyCells = level.cells.filter((c) => !placedNumbers.some((p) => p.x === c.x && p.y === c.y));
  const sampleCells = shuffleWithRng(emptyCells, rng).slice(0, 8);

  const shuffledAllowed = shuffleWithRng(allowed, rng);
  const baseTopo = mineSolverTopologyFromLevel(level);
  const mineTopo = dynamicMines ? mergeTopologyWithDynamicMines(baseTopo, dynamicMines) : baseTopo;

  const targetLen =
    handSlotCount !== undefined
      ? Math.min(5, Math.max(1, handSlotCount))
      : handSize(level);
  const validSampleCap = Math.min(5, targetLen);

  for (const cell of sampleCells) {
    for (const v of shuffledAllowed) {
      const testPlaced = [...solverPlaced, { x: cell.x, y: cell.y, value: v }];
      const solver = new MineSolver(level.cells, testPlaced, mineTopo);
      if (solver.isValid()) {
        validNumbers.add(v);
        if (validNumbers.size >= validSampleCap) break;
      }
    }
    if (validNumbers.size >= validSampleCap) break;
  }

  const validArray = Array.from(validNumbers);
  const hand: number[] = [];

  if (validArray.length > 0) {
    const numValidToInclude = Math.min(validArray.length, rng.nextInt(2) + 1);
    for (let i = 0; i < numValidToInclude; i++) {
      const idx = rng.nextInt(validArray.length);
      hand.push(validArray[idx]);
      validArray.splice(idx, 1);
    }
  }

  while (hand.length < targetLen) {
    hand.push(randomWeightedFromWeights(level, rng));
  }

  return shuffleWithRng(hand, rng);
}
