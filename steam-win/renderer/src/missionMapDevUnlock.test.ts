import { describe, expect, it } from 'vitest';
import { effectiveMissionClearedLevelKeys } from './missionMapDevUnlock';

describe('effectiveMissionClearedLevelKeys', () => {
  it('關閉測試開關時沿用真實通關進度', () => {
    expect(effectiveMissionClearedLevelKeys(['1_1'], false, ['1_1', '1_2'])).toEqual(['1_1']);
  });

  it('開啟測試開關時視為全關通關（行動卷宗全章解鎖）', () => {
    expect(effectiveMissionClearedLevelKeys([], true, ['1_1', '1_2'])).toEqual(['1_1', '1_2']);
  });
});
