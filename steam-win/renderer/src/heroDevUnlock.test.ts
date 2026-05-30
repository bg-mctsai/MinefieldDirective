import { describe, expect, it } from 'vitest';
import { effectiveUnlockedHeroIds, setDevUnlockAllHeroes } from './heroDevUnlock';

describe('effectiveUnlockedHeroIds', () => {
  it('關閉測試開關時沿用真實解鎖進度', () => {
    setDevUnlockAllHeroes(false);
    expect(effectiveUnlockedHeroIds(['xiaoming'], ['xiaoming', 'ada'])).toEqual(['xiaoming']);
  });

  it('開啟測試開關時視為全幹員解鎖', () => {
    setDevUnlockAllHeroes(true);
    expect(effectiveUnlockedHeroIds(['xiaoming'], ['xiaoming', 'ada'])).toEqual(['xiaoming', 'ada']);
    setDevUnlockAllHeroes(false);
  });
});
