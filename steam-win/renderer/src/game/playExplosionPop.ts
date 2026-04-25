/**
 * @deprecated 請改用 `emit('game.mine.explode', { stepIndex })`。
 * 本檔僅保留為過渡期 shim，下個清理 PR 會移除。
 */
import { emit } from '../audio/AudioEngine';

/** @deprecated 改用 emit('game.mine.explode', { stepIndex }) */
export function playExplosionPop(stepIndex: number, _volume01?: number) {
  void _volume01;
  emit('game.mine.explode', { stepIndex });
}
