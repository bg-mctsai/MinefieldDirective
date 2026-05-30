/** DEV：幹員檔案「開放全部幹員」時，視為全幹員已解鎖（供選角／出擊判定）。 */
export const HERO_DEV_UNLOCK_CHANGED = 'md:heroDevUnlockChanged';

let devUnlockAllHeroes = false;

export function isDevUnlockAllHeroes(): boolean {
  return devUnlockAllHeroes;
}

export function setDevUnlockAllHeroes(active: boolean): void {
  if (devUnlockAllHeroes === active) return;
  devUnlockAllHeroes = active;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HERO_DEV_UNLOCK_CHANGED, { detail: { active } }));
  }
}

export function effectiveUnlockedHeroIds(
  actualUnlockedIds: readonly string[],
  allHeroIds: readonly string[],
): string[] {
  return devUnlockAllHeroes ? [...allHeroIds] : [...actualUnlockedIds];
}
