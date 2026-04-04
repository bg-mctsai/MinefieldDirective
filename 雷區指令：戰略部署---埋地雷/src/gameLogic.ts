import { GoogleGenAI } from "@google/genai";

// This file will contain the core game logic and solver.

export type CellStatus = 'empty' | 'number' | 'mine' | 'blocked';

export interface Cell {
  x: number;
  y: number;
  status: CellStatus;
  value?: number; // The number placed by the player
  isRevealedMine?: boolean;
}

export interface Level {
  id: number;
  name: string;
  width: number;
  height: number;
  cells: { x: number; y: number }[]; // List of valid cell coordinates
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "10x10 標準方格",
    width: 10,
    height: 10,
    cells: Array.from({ length: 100 }, (_, i) => ({ x: i % 10, y: Math.floor(i / 10) })),
  },
  {
    id: 2,
    name: "十字型地圖",
    width: 11,
    height: 11,
    cells: Array.from({ length: 121 }, (_, i) => {
      const x = i % 11;
      const y = Math.floor(i / 11);
      if ((x >= 4 && x <= 6) || (y >= 4 && y <= 6)) return { x, y };
      return null;
    }).filter((c): c is { x: number; y: number } => c !== null),
  },
  {
    id: 3,
    name: "菱形地圖",
    width: 9,
    height: 9,
    cells: Array.from({ length: 81 }, (_, i) => {
      const x = i % 9;
      const y = Math.floor(i / 9);
      if (Math.abs(x - 4) + Math.abs(y - 4) <= 4) return { x, y };
      return null;
    }).filter((c): c is { x: number; y: number } => c !== null),
  },
];

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
   * Returns null if valid, or a list of conflicting number coordinates if invalid.
   */
  public getConflicts(): { x: number; y: number }[] | null {
    const relevantCells = new Set<string>();
    for (const c of this.constraints) {
      this.getNeighbors(c.x, c.y).forEach(n => relevantCells.add(n));
    }
    
    const numberCells = new Set(this.constraints.map(c => `${c.x},${c.y}`));
    const searchCells = Array.from(relevantCells).filter(c => !numberCells.has(c));

    if (this.backtrack(searchCells, 0, new Map())) {
      return null;
    }

    // If invalid, find which specific numbers are impossible
    const conflicts: { x: number; y: number }[] = [];
    for (const c of this.constraints) {
      const neighbors = this.getNeighbors(c.x, c.y);
      // We can't easily pinpoint the exact conflict in a backtracking solver without complex analysis,
      // but we can check for simple local violations which are the most common.
      let forcedMines = 0;
      let possibleMines = 0;
      
      // This is a bit simplified; a true conflict might be global.
      // But we can at least check if this specific number's local constraints are broken by forced mines elsewhere.
      const forced = this.findForced(this.constraints);
      const mineSet = new Set(forced.mines);
      const clearSet = new Set(forced.clear);

      for (const n of neighbors) {
        if (mineSet.has(n)) forcedMines++;
        if (!clearSet.has(n)) possibleMines++;
      }

      if (forcedMines > c.value || possibleMines < c.value) {
        conflicts.push({ x: c.x, y: c.y });
      }
    }

    // If no local conflicts found but global is invalid, at least return the last one
    if (conflicts.length === 0 && this.constraints.length > 0) {
      const last = this.constraints[this.constraints.length - 1];
      conflicts.push({ x: last.x, y: last.y });
    }

    return conflicts;
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
