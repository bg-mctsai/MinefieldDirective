// This file will contain the core game logic and solver.

import {
  LEVEL_DEFINITIONS,
  buildPlayableLevel,
  type PlayableLevel,
} from './levelData';
import {
  areLogicNeighbors,
  logicNeighborKeys,
  neighborModeForGridSystem,
  type NeighborMode,
  withinForcedRevealZone,
} from './levelData/gridTopology';

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
 * 關卡資料來源：`levelData` 的 `LEVEL_DEFINITIONS` 經 `buildPlayableLevel` 展開。
 * 陣列本體固定，內容可由 `rebuildPlayableLevelsFromDefinitions` 更新（開發重讀 JSON）。
 */
export const LEVELS: Level[] = [];

function syncLevelsFromDefinitions(): void {
  const next = LEVEL_DEFINITIONS.map(buildPlayableLevel);
  LEVELS.length = 0;
  LEVELS.push(...next);
}

syncLevelsFromDefinitions();

export function rebuildPlayableLevelsFromDefinitions(): void {
  syncLevelsFromDefinitions();
}

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

/** 與剛埋數字格邏輯鄰接的衝突線索（強調兩個數字邏輯互掐，不報座標） */
function adjacentConflictDisplayValue(
  details: ConflictDetail[],
  lastPlaced: { x: number; y: number; value: number },
  validKeys: Set<string>,
  neighborMode: NeighborMode,
  boardW: number,
  boardH: number
): number | undefined {
  for (const d of details) {
    if (d.x === lastPlaced.x && d.y === lastPlaced.y) continue;
    if (
      areLogicNeighbors(d.x, d.y, lastPlaced.x, lastPlaced.y, validKeys, neighborMode, boardW, boardH)
    ) {
      return d.displayValue;
    }
  }
  return undefined;
}

/** 敗北台詞：長官斥責——強調電報數字與鄰格線索衝突（如 3 與 5），不報行列 */
export function formatLossExplanation(
  details: ConflictDetail[],
  lastPlaced: { x: number; y: number; value: number },
  lossTopology: LossUiTopology
): string {
  const v = lastPlaced.value;
  const other = adjacentConflictDisplayValue(
    details,
    lastPlaced,
    lossTopology.validKeys,
    lossTopology.neighborMode,
    lossTopology.boardW,
    lossTopology.boardH
  );
  if (other !== undefined) {
    return `長官回電大罵：「電報要你埋『${v}』，你選那格跟鄰格『${other}』打架？重選座標！」`;
  }
  if (details.length > 0) {
    const w = details[0].displayValue;
    // 與鄰格無直接對撞、但線索數字與電報相同時，避免聽成「兩個 5 互衝」——改斥座標選錯
    if (w === v) {
      return `長官回電大罵：「電報數字是『${v}』沒錯，你格選錯了還敢回報？重來！」`;
    }
    return `長官回電大罵：「電報叫你埋『${v}』，跟盤面『${w}』兜不攏——誰准你這樣執行？重來！」`;
  }
  return `長官回電大罵：「照電報數字『${v}』去佈，盤面卻兜不攏——執行錯誤，重來！」`;
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
 * 敗北當下盤面已無解，無法對「放錯後」呼叫 findForced。
 * 改在「放錯前」推論邏輯鄰域內已強制的雷，標成 X 讓玩家看懂。
 */
export function lossExplosionMarkCells(
  validCells: { x: number; y: number }[],
  placedBeforeLoss: { x: number; y: number; value: number }[],
  lastPlaced: { x: number; y: number },
  topo: LossUiTopology
): { x: number; y: number }[] {
  const solver = new MineSolver(validCells, placedBeforeLoss, {
    neighborMode: topo.neighborMode,
    boardWidth: topo.boardW,
    boardHeight: topo.boardH,
  });
  const { mines } = solver.findForced(placedBeforeLoss);
  const lx = lastPlaced.x;
  const ly = lastPlaced.y;
  const out: { x: number; y: number }[] = [];
  for (const key of mines) {
    const comma = key.indexOf(',');
    const nx = Number(key.slice(0, comma));
    const ny = Number(key.slice(comma + 1));
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) continue;
    if (
      !areLogicNeighbors(nx, ny, lx, ly, topo.validKeys, topo.neighborMode, topo.boardW, topo.boardH)
    ) {
      continue;
    }
    out.push({ x: nx, y: ny });
  }
  return out;
}

/**
 * Solver logic to check if a placement is valid and find forced mines.
 */
export type MineSolverTopology = {
  neighborMode: NeighborMode;
  boardWidth: number;
  boardHeight: number;
  forcedMineKeys?: Set<string>;
  /**
   * 深海廢雷：佔格、不可放數字，但**不計入**任何鄰格數字的雷數（與 forcedMineKeys 不同）。
   */
  ghostMineKeys?: Set<string>;
};

export function mineSolverTopologyFromLevel(level: PlayableLevel): MineSolverTopology {
  const forcedMineKeys = new Set((level.definition.forcedMineCells ?? []).map(([x, y]) => `${x},${y}`));
  return {
    neighborMode: neighborModeForGridSystem(level.definition.gridSystem),
    boardWidth: level.width,
    boardHeight: level.height,
    forcedMineKeys,
  };
}

/** 將動態地雷掛在拓撲的 ghostMineKeys（不計入數字約束，僅佔格） */
export function mergeTopologyWithDynamicMines(
  base: MineSolverTopology,
  dynamicMines: Set<string>,
): MineSolverTopology {
  if (dynamicMines.size === 0) return base;
  return { ...base, ghostMineKeys: new Set(dynamicMines) };
}

export type LossUiTopology = {
  validKeys: Set<string>;
  neighborMode: NeighborMode;
  boardW: number;
  boardH: number;
};

export function lossUiTopologyFromLevel(level: PlayableLevel): LossUiTopology {
  return {
    validKeys: new Set(level.cells.map((c) => `${c.x},${c.y}`)),
    neighborMode: neighborModeForGridSystem(level.definition.gridSystem),
    boardW: level.width,
    boardH: level.height,
  };
}

export class MineSolver {
  private grid: Map<string, number | null>; // null = unknown, 0 = no mine, 1 = mine
  private constraints: { x: number; y: number; value: number }[];
  private validCells: Set<string>;
  private neighborCache: Map<string, string[]>;
  private constraintNeighbors: Map<number, string[]>;
  private neighborMode: NeighborMode;
  private boardW: number;
  private boardH: number;
  private forcedMineKeys: Set<string>;
  private ghostMineKeys: Set<string>;

  constructor(
    validCells: { x: number; y: number }[],
    placedNumbers: { x: number; y: number; value: number }[],
    topology?: MineSolverTopology
  ) {
    this.validCells = new Set(validCells.map((c) => `${c.x},${c.y}`));
    this.constraints = placedNumbers;
    this.grid = new Map();
    this.neighborCache = new Map();
    this.constraintNeighbors = new Map();
    this.neighborMode = topology?.neighborMode ?? 'MOORE';
    this.boardW = topology?.boardWidth ?? 0;
    this.boardH = topology?.boardHeight ?? 0;
    this.forcedMineKeys = topology?.forcedMineKeys ?? new Set<string>();
    this.ghostMineKeys = topology?.ghostMineKeys ?? new Set<string>();

    // Pre-calculate neighbors for constraints
    this.constraints.forEach((c, idx) => {
      this.constraintNeighbors.set(idx, this.getNeighbors(c.x, c.y));
    });
  }

  private getNeighbors(x: number, y: number): string[] {
    const key = `${x},${y}`;
    if (this.neighborCache.has(key)) return this.neighborCache.get(key)!;

    const neighbors = logicNeighborKeys(
      x,
      y,
      this.validCells,
      this.neighborMode,
      this.boardW,
      this.boardH
    );

    this.neighborCache.set(key, neighbors);
    return neighbors;
  }

  /**
   * 數字格與其八鄰「非數字格」構成二分連邊；同一連通分量內變數才互相牽連，可與其他分量獨立求解。
   */
  private buildConstraintComponents(): { constraintIndices: number[]; vars: string[] }[] {
    const n = this.constraints.length;
    if (n === 0) return [];

    const numberCells = new Set(this.constraints.map(c => `${c.x},${c.y}`));
    const varToConstraints = new Map<string, number[]>();
    for (let i = 0; i < n; i++) {
      for (const nk of this.constraintNeighbors.get(i)!) {
        if (numberCells.has(nk) || this.forcedMineKeys.has(nk) || this.ghostMineKeys.has(nk)) continue;
        let arr = varToConstraints.get(nk);
        if (!arr) {
          arr = [];
          varToConstraints.set(nk, arr);
        }
        arr.push(i);
      }
    }

    const seenC = new Array<boolean>(n).fill(false);
    const out: { constraintIndices: number[]; vars: string[] }[] = [];

    for (let s = 0; s < n; s++) {
      if (seenC[s]) continue;
      const cIdx: number[] = [];
      const varSet = new Set<string>();
      const stack: number[] = [s];
      seenC[s] = true;
      while (stack.length > 0) {
        const i = stack.pop()!;
        cIdx.push(i);
        for (const nk of this.constraintNeighbors.get(i)!) {
          if (numberCells.has(nk) || this.forcedMineKeys.has(nk) || this.ghostMineKeys.has(nk)) continue;
          varSet.add(nk);
          const others = varToConstraints.get(nk);
          if (!others) continue;
          for (const j of others) {
            if (!seenC[j]) {
              seenC[j] = true;
              stack.push(j);
            }
          }
        }
      }
      cIdx.sort((a, b) => a - b);
      out.push({ constraintIndices: cIdx, vars: Array.from(varSet).sort() });
    }
    return out;
  }

  private isPartiallyValidFor(currentMines: Map<string, number>, constraintIndices: readonly number[]): boolean {
    for (const i of constraintIndices) {
      const c = this.constraints[i];
      const neighbors = this.constraintNeighbors.get(i)!;
      let mineCount = 0;
      let unknownCount = 0;
      for (const n of neighbors) {
        if (this.ghostMineKeys.has(n)) continue;
        const val = currentMines.get(n) ?? (this.forcedMineKeys.has(n) ? 1 : undefined);
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

  private checkAllFor(currentMines: Map<string, number>, constraintIndices: readonly number[]): boolean {
    for (const i of constraintIndices) {
      const c = this.constraints[i];
      const neighbors = this.constraintNeighbors.get(i)!;
      let mineCount = 0;
      for (const n of neighbors) {
        if (this.ghostMineKeys.has(n)) continue;
        if ((currentMines.get(n) ?? (this.forcedMineKeys.has(n) ? 1 : 0)) === 1) mineCount++;
      }
      if (mineCount !== c.value) return false;
    }
    return true;
  }

  private backtrackForComponent(
    vars: string[],
    index: number,
    currentMines: Map<string, number>,
    constraintIndices: readonly number[]
  ): boolean {
    if (index === vars.length) {
      return this.checkAllFor(currentMines, constraintIndices);
    }
    const cell = vars[index];
    if (currentMines.has(cell)) {
      return this.backtrackForComponent(vars, index + 1, currentMines, constraintIndices);
    }
    currentMines.set(cell, 0);
    if (this.isPartiallyValidFor(currentMines, constraintIndices) && this.backtrackForComponent(vars, index + 1, currentMines, constraintIndices)) {
      return true;
    }
    currentMines.set(cell, 1);
    if (this.isPartiallyValidFor(currentMines, constraintIndices) && this.backtrackForComponent(vars, index + 1, currentMines, constraintIndices)) {
      return true;
    }
    currentMines.delete(cell);
    return false;
  }

  private findForcedInComponent(
    constraintIndices: readonly number[],
    vars: readonly string[]
  ): { mines: string[]; clear: string[] } {
    const forcedMines: string[] = [];
    const forcedClear: string[] = [];
    const varArr = [...vars];

    // 1) 先取一組參考解；順便證明此分量可滿足
    const refSol = new Map<string, number>();
    if (!this.backtrackForComponent(varArr, 0, refSol, constraintIndices)) {
      return { mines: [], clear: [] };
    }
    const ref = new Map(refSol);

    // 2) 逐格只測「反向值」；已確認的 forced 值累積帶入後續搜尋以縮小空間
    const known = new Map<string, number>();
    for (const cell of vars) {
      const refVal = ref.get(cell)!;
      const probe = new Map(known);
      probe.set(cell, 1 - refVal);
      const altOk = this.backtrackForComponent(varArr, 0, probe, constraintIndices);
      if (!altOk) {
        if (refVal === 1) forcedMines.push(cell);
        else forcedClear.push(cell);
        known.set(cell, refVal);
      }
    }
    return { mines: forcedMines, clear: forcedClear };
  }

  private conflictDetailsFromUnsatComponent(
    constraintIndices: readonly number[],
    vars: readonly string[]
  ): ConflictDetail[] {
    const details: ConflictDetail[] = [];
    const forced = this.findForcedInComponent(constraintIndices, vars);
    const mineSet = new Set(forced.mines);
    const clearSet = new Set(forced.clear);

    for (const i of constraintIndices) {
      const c = this.constraints[i];
      const neighbors = this.constraintNeighbors.get(i)!;
      let forcedMines = 0;
      let possibleMines = 0;
      for (const n of neighbors) {
        if (this.ghostMineKeys.has(n)) continue;
        if (this.forcedMineKeys.has(n)) {
          forcedMines++;
          continue;
        }
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

    if (details.length === 0 && constraintIndices.length > 0) {
      const li = constraintIndices[constraintIndices.length - 1]!;
      const last = this.constraints[li]!;
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
   * 若盤面有效則回傳 null；否則回傳衝突數字格詳情（供 UI 說明與標示）。
   */
  public getConflicts(): ConflictDetail[] | null {
    const numberCellKeys = new Set(this.constraints.map((c) => `${c.x},${c.y}`));
    const blockNumberOnKeys = new Set([...this.forcedMineKeys, ...this.ghostMineKeys]);
    for (const k of blockNumberOnKeys) {
      if (!numberCellKeys.has(k)) continue;
      const comma = k.indexOf(',');
      const x = Number(k.slice(0, comma));
      const y = Number(k.slice(comma + 1));
      const c = this.constraints.find((cc) => cc.x === x && cc.y === y);
      if (c) {
        return [{ x, y, displayValue: c.value, kind: 'global_unsatisfiable' }];
      }
    }
    const components = this.buildConstraintComponents();
    for (const comp of components) {
      if (!this.backtrackForComponent(comp.vars, 0, new Map(), comp.constraintIndices)) {
        return this.conflictDetailsFromUnsatComponent(comp.constraintIndices, comp.vars);
      }
    }
    return null;
  }

  /**
   * Checks if there's at least one valid mine distribution.
   */
  public isValid(): boolean {
    return this.getConflicts() === null;
  }

  /**
   * Finds cells that MUST be mines or MUST NOT be mines.
   */
  public findForced(_placedNumbers: { x: number; y: number; value: number }[]): { mines: string[]; clear: string[] } {
    const components = this.buildConstraintComponents();
    const mines: string[] = [];
    const clear: string[] = [];
    for (const comp of components) {
      const f = this.findForcedInComponent(comp.constraintIndices, comp.vars);
      mines.push(...f.mines);
      clear.push(...f.clear);
    }
    return { mines: Array.from(new Set(mines)), clear: Array.from(new Set(clear)) };
  }
}

