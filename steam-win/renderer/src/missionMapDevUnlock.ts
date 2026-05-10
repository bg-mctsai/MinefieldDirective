/** DEV：行動卷宗「開放全部章節」時，視為全關已通關（供解鎖判定）。 */
export function effectiveMissionClearedLevelKeys(
  actualClearedLevelKeys: string[],
  devUnlockAllChapters: boolean,
  allLevelKeys: string[],
): string[] {
  return devUnlockAllChapters ? [...allLevelKeys] : actualClearedLevelKeys;
}
