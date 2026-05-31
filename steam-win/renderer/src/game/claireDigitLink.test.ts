import { describe, expect, it } from 'vitest';
import {
  CLAIRE_DIGIT_LINK_FIREPOWER_PER_EDGE,
  claireDigitLinkEdgeCount,
  claireDigitLinkFirepowerBonus,
} from './mineCombatVisual';
import type { PlacedNumber } from './types';

const squareCells = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
  { x: 2, y: 1 },
];

function placed(...cells: ({ x: number; y: number; value: number } & Partial<Pick<PlacedNumber, 'fortifyFirepower'>>)[]): PlacedNumber[] {
  return cells;
}

describe('claireDigitLinkFirepowerBonus', () => {
  it('兩格相鄰 +2', () => {
    const nums = placed(
      { x: 0, y: 0, value: 3 },
      { x: 1, y: 0, value: 4 },
    );
    expect(claireDigitLinkEdgeCount(nums, squareCells, 'SQUARE', 3, 2)).toBe(1);
    expect(claireDigitLinkFirepowerBonus(nums, squareCells, 'SQUARE', 3, 2)).toBe(2);
  });

  it('3–4–4 鏈兩對 +4', () => {
    const nums = placed(
      { x: 0, y: 0, value: 3 },
      { x: 1, y: 0, value: 4 },
      { x: 2, y: 0, value: 4 },
    );
    expect(claireDigitLinkEdgeCount(nums, squareCells, 'SQUARE', 3, 2)).toBe(2);
    expect(claireDigitLinkFirepowerBonus(nums, squareCells, 'SQUARE', 3, 2)).toBe(4);
  });

  it('3–4–3 鏈兩對 +4', () => {
    const nums = placed(
      { x: 0, y: 0, value: 3 },
      { x: 1, y: 0, value: 4 },
      { x: 2, y: 0, value: 3 },
    );
    const wideCells = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    expect(claireDigitLinkEdgeCount(nums, wideCells, 'SQUARE', 3, 1)).toBe(2);
    expect(claireDigitLinkFirepowerBonus(nums, wideCells, 'SQUARE', 3, 1)).toBe(4);
  });

  it('3–4–4–5 鏈三對 +6', () => {
    const nums = placed(
      { x: 0, y: 0, value: 3 },
      { x: 1, y: 0, value: 4 },
      { x: 2, y: 0, value: 4 },
      { x: 3, y: 0, value: 5 },
    );
    const wideCells = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ];
    expect(claireDigitLinkEdgeCount(nums, wideCells, 'SQUARE', 4, 1)).toBe(3);
    expect(claireDigitLinkFirepowerBonus(nums, wideCells, 'SQUARE', 4, 1)).toBe(6);
  });

  it('環狀 3–4–4–5 四對 +8（含 3–5 閉合邊）', () => {
    const nums = placed(
      { x: 0, y: 0, value: 3 },
      { x: 1, y: 0, value: 4 },
      { x: 1, y: 1, value: 4 },
      { x: 0, y: 1, value: 5 },
    );
    expect(claireDigitLinkEdgeCount(nums, squareCells, 'SQUARE', 3, 2)).toBe(4);
    expect(claireDigitLinkFirepowerBonus(nums, squareCells, 'SQUARE', 3, 2)).toBe(8);
  });

  it('不相鄰不計；加固火力格不參與鏈結', () => {
    const nums = placed(
      { x: 0, y: 0, value: 3 },
      { x: 2, y: 0, value: 4 },
      { x: 0, y: 1, value: 2, fortifyFirepower: true },
    );
    expect(claireDigitLinkFirepowerBonus(nums, squareCells, 'SQUARE', 3, 2)).toBe(0);
  });

  it('六角地形：相鄰兩格 +2', () => {
    const hexCells = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const nums = placed(
      { x: 0, y: 0, value: 3 },
      { x: 1, y: 0, value: 4 },
    );
    expect(claireDigitLinkEdgeCount(nums, hexCells, 'HEXAGON', 2, 2)).toBe(1);
    expect(
      claireDigitLinkFirepowerBonus(
        nums,
        hexCells,
        'HEXAGON',
        2,
        2,
        CLAIRE_DIGIT_LINK_FIREPOWER_PER_EDGE,
      ),
    ).toBe(2);
  });
});
