import { LEVEL_MAX } from './game/gameProgressStorage';

/** DEV：行動卷宗「開放全部章節」時傳入 MissionMap／onStart 的 effective highestCleared。 */
export function effectiveMissionHighestCleared(
  actualHighestCleared: number,
  devUnlockAllChapters: boolean,
): number {
  return devUnlockAllChapters ? LEVEL_MAX : actualHighestCleared;
}
