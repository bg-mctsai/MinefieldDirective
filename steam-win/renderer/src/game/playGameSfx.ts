/**
 * @deprecated 請改用 `audio/AudioEngine` 的 emit API：
 * - `emit('game.countdown.tick', { remainingSeconds })`
 * - `emit('game.time.up')`
 * - `emit('game.number.place', { value })`
 * 本檔僅保留為過渡期 shim，下個清理 PR 會移除。
 */
import { emit } from '../audio/AudioEngine';

/** @deprecated 改用 emit('game.countdown.tick', { remainingSeconds }) */
export function playCountdownTick(remainingSeconds: number, _volume01?: number) {
  void _volume01;
  emit('game.countdown.tick', { remainingSeconds });
}

/** @deprecated 改用 emit('game.time.up') */
export function playTimeUpChirp(_volume01?: number) {
  void _volume01;
  emit('game.time.up');
}

/** @deprecated 改用 emit('game.number.place', { value }) */
export function playPlaceNumberSound(value: number, _volume01?: number) {
  void _volume01;
  emit('game.number.place', { value });
}
