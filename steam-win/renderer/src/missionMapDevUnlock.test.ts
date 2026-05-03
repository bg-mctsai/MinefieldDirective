import { describe, expect, it } from 'vitest';
import { LEVEL_MAX } from './game/gameProgressStorage';
import { effectiveMissionHighestCleared } from './missionMapDevUnlock';

describe('effectiveMissionHighestCleared', () => {
  it('關閉測試開關時沿用真實通關進度', () => {
    expect(effectiveMissionHighestCleared(0, false)).toBe(0);
    expect(effectiveMissionHighestCleared(7, false)).toBe(7);
  });

  it('開啟測試開關時視為已通關至 LEVEL_MAX（行動卷宗全章解鎖）', () => {
    expect(effectiveMissionHighestCleared(0, true)).toBe(LEVEL_MAX);
    expect(effectiveMissionHighestCleared(3, true)).toBe(LEVEL_MAX);
  });
});
