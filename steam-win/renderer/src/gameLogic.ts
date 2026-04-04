// This file will contain the core game logic and solver.

import { LEVEL_DEFINITIONS, buildPlayableLevel, type PlayableLevel } from './levelData';

export type CellStatus = 'empty' | 'number' | 'mine' | 'blocked';

export interface Cell {
  x: number;
  y: number;
  status: CellStatus;
  value?: number; // The number placed by the player
  isRevealedMine?: boolean;
}

/** 執行時關卡：由企劃定義 `LEVEL_DEFINITIONS` 經 `buildPlayableLevel` 轉成可玩資料 */
export type Level = PlayableLevel;

/**
 * 關卡資料來源：`levelData/levelDefinitionsFactory` 產生 100 筆 `LevelDefinition`，
 * 再經 `buildPlayableLevel` 展開為 `cells` / `initialHints`。
 */
export const LEVELS: Level[] = LEVEL_DEFINITIONS.map(buildPlayableLevel);

/** 單一數字格與邏輯推論衝突的類型（供玩家提示用） */
export type ConflictDetail =
  | {
      x: number;
      y: number;
      displayValue: number;
      kind: 'too_many_known_mines';
      forcedMineCount: number;
    }
  | {
      x: number;
      y: number;
      displayValue: number;
      kind: 'cannot_fit_required_mines';
      maxPossibleMines: number;
    }
  | {
      x: number;
      y: number;
      displayValue: number;
      kind: 'global_unsatisfiable';
    };

/** 與剛埋數字格八鄰相接的衝突線索（強調兩個數字邏輯互掐，不報座標） */
function adjacentConflictDisplayValue(
  details: ConflictDetail[],
  lastPlaced: { x: number; y: number; value: number }
): number | undefined {
  for (const d of details) {
    if (d.x === lastPlaced.x && d.y === lastPlaced.y) continue;
    const dx = Math.abs(d.x - lastPlaced.x);
    const dy = Math.abs(d.y - lastPlaced.y);
    if (dx <= 1 && dy <= 1) return d.displayValue;
  }
  return undefined;
}

/** 敗北台詞：長官斥責——強調電碼數字與鄰格線索衝突（如 3 與 5），不報行列 */
export function formatLossExplanation(
  details: ConflictDetail[],
  lastPlaced: { x: number; y: number; value: number }
): string {
  const v = lastPlaced.value;
  const other = adjacentConflictDisplayValue(details, lastPlaced);
  if (other !== undefined) {
    return `長官回電大罵：「照電碼埋『${v}』與鄰格『${other}』衝突，還能埋炸？重譯！」`;
  }
  if (details.length > 0) {
    const w = details[0].displayValue;
    // 與鄰格無直接對撞、但線索數字與電碼相同時，避免聽成「兩個 5 互衝」——改斥座標譯錯
    if (w === v) {
      return `長官回電大罵：「怎麼會把『${v}』埋在那？座標譯錯還敢佈雷？重譯！」`;
    }
    return `長官回電大罵：「照電碼埋『${v}』跟盤面『${w}』兜不攏還能埋炸？重譯！」`;
  }
  return `長官回電大罵：「照電碼埋『${v}』邏輯兜不攏還能埋炸？重譯！」`;
}

const cellKey = (c: { x: number; y: number }) => `${c.x},${c.y}`;

/** 敗北時要高亮的數字格：衝突線索 + 剛埋下的那格（兩邊數字都白字標衝突） */
export function lossConflictHighlightCells(
  details: ConflictDetail[],
  lastPlaced: { x: number; y: number }
): { x: number; y: number }[] {
  const seen = new Set<string>();
  const out: { x: number; y: number }[] = [];
  for (const d of details) {
    const k = cellKey(d);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ x: d.x, y: d.y });
  }
  const lastK = cellKey(lastPlaced);
  if (!seen.has(lastK)) {
    out.push({ x: lastPlaced.x, y: lastPlaced.y });
  }
  return out;
}

/**
 * Solver logic to check if a placement is valid and find forced mines.
 */
export class MineSolver {
  private grid: Map<string, number | null>; // null = unknown, 0 = no mine, 1 = mine
  private constraints: { x: number; y: number; value: number }[];
  private validCells: Set<string>;
  private neighborCache: Map<string, string[]>;
  private constraintNeighbors: Map<number, string[]>;

  constructor(validCells: { x: number; y: number }[], placedNumbers: { x: number; y: number; value: number }[]) {
    this.validCells = new Set(validCells.map(c => `${c.x},${c.y}`));
    this.constraints = placedNumbers;
    this.grid = new Map();
    this.neighborCache = new Map();
    this.constraintNeighbors = new Map();
    
    // Pre-calculate neighbors for constraints
    this.constraints.forEach((c, idx) => {
      this.constraintNeighbors.set(idx, this.getNeighbors(c.x, c.y));
    });
  }

  private getNeighbors(x: number, y: number): string[] {
    const key = `${x},${y}`;
    if (this.neighborCache.has(key)) return this.neighborCache.get(key)!;

    const neighbors: string[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        const nKey = `${nx},${ny}`;
        if (this.validCells.has(nKey)) {
          neighbors.push(nKey);
        }
      }
    }
    this.neighborCache.set(key, neighbors);
    return neighbors;
  }

  /**
   * Checks if there's at least one valid mine distribution.
   * 若盤面有效則回傳 null；否則回傳衝突數字格詳情（供 UI 說明與標示）。
   */
  public getConflicts(): ConflictDetail[] | null {
    const relevantCells = new Set<string>();
    for (const c of this.constraints) {
      this.getNeighbors(c.x, c.y).forEach(n => relevantCells.add(n));
    }

    const numberCells = new Set(this.constraints.map(c => `${c.x},${c.y}`));
    const searchCells = Array.from(relevantCells).filter(c => !numberCells.has(c));

    if (this.backtrack(searchCells, 0, new Map())) {
      return null;
    }

    const details: ConflictDetail[] = [];
    const forced = this.findForced(this.constraints);
    const mineSet = new Set(forced.mines);
    const clearSet = new Set(forced.clear);

    for (const c of this.constraints) {
      const neighbors = this.getNeighbors(c.x, c.y);
      let forcedMines = 0;
      let possibleMines = 0;

      for (const n of neighbors) {
        if (mineSet.has(n)) forcedMines++;
        if (!clearSet.has(n)) possibleMines++;
      }

      if (forcedMines > c.value) {
        details.push({
          x: c.x,
          y: c.y,
          displayValue: c.value,
          kind: 'too_many_known_mines',
          forcedMineCount: forcedMines,
        });
      } else if (possibleMines < c.value) {
        details.push({
          x: c.x,
          y: c.y,
          displayValue: c.value,
          kind: 'cannot_fit_required_mines',
          maxPossibleMines: possibleMines,
        });
      }
    }

    if (details.length === 0 && this.constraints.length > 0) {
      const last = this.constraints[this.constraints.length - 1];
      details.push({
        x: last.x,
        y: last.y,
        displayValue: last.value,
        kind: 'global_unsatisfiable',
      });
    }

    return details;
  }

  /**
   * Checks if there's at least one valid mine distribution.
   */
  public isValid(): boolean {
    return this.getConflicts() === null;
  }

  private backtrack(cells: string[], index: number, currentMines: Map<string, number>): boolean {
    if (index === cells.length) {
      return this.checkAllConstraints(currentMines);
    }

    const cell = cells[index];

    // Try no mine
    currentMines.set(cell, 0);
    if (this.isPartiallyValid(currentMines) && this.backtrack(cells, index + 1, currentMines)) {
      return true;
    }

    // Try mine
    currentMines.set(cell, 1);
    if (this.isPartiallyValid(currentMines) && this.backtrack(cells, index + 1, currentMines)) {
      return true;
    }

    currentMines.delete(cell);
    return false;
  }

  private isPartiallyValid(currentMines: Map<string, number>): boolean {
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      const neighbors = this.constraintNeighbors.get(i)!;
      let mineCount = 0;
      let unknownCount = 0;

      for (const n of neighbors) {
        const val = currentMines.get(n);
        if (val !== undefined) {
          if (val === 1) mineCount++;
        } else {
          unknownCount++;
        }
      }

      if (mineCount > c.value) return false;
      if (mineCount + unknownCount < c.value) return false;
    }
    return true;
  }

  private checkAllConstraints(currentMines: Map<string, number>): boolean {
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      const neighbors = this.constraintNeighbors.get(i)!;
      let mineCount = 0;
      for (const n of neighbors) {
        if (currentMines.get(n) === 1) mineCount++;
      }
      if (mineCount !== c.value) return false;
    }
    return true;
  }

  /**
   * Finds cells that MUST be mines or MUST NOT be mines.
   */
  public findForced(placedNumbers: { x: number; y: number; value: number }[]): { mines: string[], clear: string[] } {
    const relevantCells = new Set<string>();
    for (const c of this.constraints) {
      this.getNeighbors(c.x, c.y).forEach(n => relevantCells.add(n));
    }
    const numberCells = new Set(this.constraints.map(c => `${c.x},${c.y}`));
    const searchCells = Array.from(relevantCells).filter(c => !numberCells.has(c));

    const solutions: Map<string, number>[] = [];
    this.findAllSolutions(searchCells, 0, new Map(), solutions, 100); // Limit to 100 solutions for performance

    if (solutions.length === 0) return { mines: [], clear: [] };

    const forcedMines: string[] = [];
    const forcedClear: string[] = [];

    for (const cell of searchCells) {
      let alwaysMine = true;
      let alwaysClear = true;
      for (const sol of solutions) {
        if (sol.get(cell) === 1) alwaysClear = false;
        if (sol.get(cell) === 0) alwaysMine = false;
      }
      if (alwaysMine) forcedMines.push(cell);
      if (alwaysClear) forcedClear.push(cell);
    }

    return { mines: forcedMines, clear: forcedClear };
  }

  private findAllSolutions(cells: string[], index: number, currentMines: Map<string, number>, solutions: Map<string, number>[], limit: number) {
    if (solutions.length >= limit) return;
    if (index === cells.length) {
      if (this.checkAllConstraints(currentMines)) {
        solutions.push(new Map(currentMines));
      }
      return;
    }

    const cell = cells[index];
    
    // Try both
    for (const val of [0, 1]) {
      currentMines.set(cell, val);
      if (this.isPartiallyValid(currentMines)) {
        this.findAllSolutions(cells, index + 1, currentMines, solutions, limit);
      }
      if (solutions.length >= limit) return;
    }
    currentMines.delete(cell);
  }
}

