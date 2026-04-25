import { useCallback } from 'react';
import { AudioEngine } from './AudioEngine';
import type { AudioBusId } from './audioEventCatalog';

/**
 * 手動 ducking：多數 duck 由 `audioEventCatalog` 的 `duck` 欄位自動觸發，
 * 此 hook 只用在「非音效事件導致的側鏈壓制」場景，例如：
 * - 旁白開始時壓下 BGM
 * - UI 開啟重要對話框時降 SFX
 *
 * 回傳 `duckBus(bus, mul, durSec)`：在 durSec 內把 bus 壓到 gainMul，之後平滑恢復。
 */
export function useAudioDuck() {
  const duckBus = useCallback(
    (bus: Exclude<AudioBusId, 'master'>, mul: number, durSec: number) => {
      const clampedMul = Math.min(1, Math.max(0, mul));
      const clampedDur = Math.max(0.05, durSec);
      const prev = AudioEngine.getBusUserGain(bus);
      AudioEngine.setBusGain(bus, prev * clampedMul);
      window.setTimeout(() => {
        AudioEngine.setBusGain(bus, prev);
      }, Math.ceil(clampedDur * 1000));
    },
    [],
  );

  return { duckBus };
}
