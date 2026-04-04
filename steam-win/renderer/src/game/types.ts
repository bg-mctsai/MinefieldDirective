import type { Level } from '../gameLogic';

export interface GameState {
  gameId: number;
  level: Level;
  placedNumbers: { x: number; y: number; value: number }[];
  revealedMines: Set<string>;
  revealedClear: Set<string>;
  hand: number[];
  placedInTurn: number;
  status: 'playing' | 'won' | 'lost' | 'exploding';
  message: string;
  conflictCells: { x: number; y: number }[];
}
