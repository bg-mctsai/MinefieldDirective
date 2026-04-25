/**
 * @deprecated 請改用 `audio/AudioEngine` 的 `emit('ui.menu.hover')` /
 * `emit('ui.mission.enterConfirm')`。本檔僅保留為過渡期 shim，下個清理 PR 會移除。
 */
import { emit } from './audio/AudioEngine';

/** @deprecated 改用 emit('ui.menu.hover') */
export function playHoverBeep(_volume01: number) {
  void _volume01;
  emit('ui.menu.hover');
}

/** @deprecated 改用 emit('ui.mission.enterConfirm') */
export function playMissionEnterConfirmBeep(_volume01: number) {
  void _volume01;
  emit('ui.mission.enterConfirm');
}
