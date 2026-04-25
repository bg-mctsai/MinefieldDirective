import { AudioEngine } from './AudioEngine';
import type { AudioBusSettings } from '../home/types';

/** 把使用者的 bus 設定一次套到 AudioEngine；呼叫端不用管 bus 數量。 */
export function applyAudioBusSettings(buses: AudioBusSettings) {
  AudioEngine.setBusGain('master', buses.master);
  AudioEngine.setBusGain('ui', buses.ui);
  AudioEngine.setBusGain('sfx', buses.sfx);
  AudioEngine.setBusGain('vo', buses.vo);
  AudioEngine.setBusGain('bgm', buses.bgm);
}
