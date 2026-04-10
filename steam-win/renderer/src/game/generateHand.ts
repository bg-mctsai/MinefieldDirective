import { MineSolver, mergeTopologyWithDynamicMines, mineSolverTopologyFromLevel, type Level } from '../gameLogic';

function allowedValuesFromCommands(level: Level): number[] {
  const w = level.definition.commands.weights;
  const nums = Object.entries(w)
    .filter(([, wt]) => wt > 0)
    .map(([k]) => parseInt(k, 10))
    .filter((n) => n >= 1 && n <= 8);
  return nums.length ? nums : [3, 4, 5, 6];
}

function randomWeightedFromWeights(level: Level): number {
  const { poolType, weights } = level.definition.commands;
  const entries = Object.entries(weights).filter(([, wt]) => wt > 0);
  if (entries.length === 0) return 4;

  if (poolType === 'RANDOM') {
    const pick = entries[Math.floor(Math.random() * entries.length)];
    return parseInt(pick[0], 10);
  }

  const totalWeight = entries.reduce((a, [, b]) => a + b, 0);
  let r = Math.random() * totalWeight;
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
  placedNumbers: { x: number; y: number; value: number }[],
  dynamicMines?: Set<string>,
): number[] {
  const allowed = allowedValuesFromCommands(level);
  const validNumbers = new Set<number>();
  const emptyCells = level.cells.filter((c) => !placedNumbers.some((p) => p.x === c.x && p.y === c.y));
  const sampleCells = emptyCells.sort(() => Math.random() - 0.5).slice(0, 8);

  const shuffledAllowed = [...allowed].sort(() => Math.random() - 0.5);
  const baseTopo = mineSolverTopologyFromLevel(level);
  const mineTopo = dynamicMines ? mergeTopologyWithDynamicMines(baseTopo, dynamicMines) : baseTopo;

  for (const cell of sampleCells) {
    for (const v of shuffledAllowed) {
      const testPlaced = [...placedNumbers, { x: cell.x, y: cell.y, value: v }];
      const solver = new MineSolver(level.cells, testPlaced, mineTopo);
      if (solver.isValid()) {
        validNumbers.add(v);
        if (validNumbers.size >= 3) break;
      }
    }
    if (validNumbers.size >= 3) break;
  }

  const validArray = Array.from(validNumbers);
  const targetLen = handSize(level);
  const hand: number[] = [];

  if (validArray.length > 0) {
    const numValidToInclude = Math.min(validArray.length, Math.floor(Math.random() * 2) + 1);
    for (let i = 0; i < numValidToInclude; i++) {
      const idx = Math.floor(Math.random() * validArray.length);
      hand.push(validArray[idx]);
      validArray.splice(idx, 1);
    }
  }

  while (hand.length < targetLen) {
    hand.push(randomWeightedFromWeights(level));
  }

  return hand.sort(() => Math.random() - 0.5);
}
