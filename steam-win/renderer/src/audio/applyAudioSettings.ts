import { AudioEngine } from './AudioEngine';
import type { HomeSettings } from '../home/types';

/** 把使用者的音訊設定套到 AudioEngine；含音樂／音效總開關。 */
export function applyAudioSettings(settings: HomeSettings) {
  const buses = settings.buses;
  AudioEngine.setBusGain('master', buses.master);
  AudioEngine.setBusGain('ui', settings.sfxEnabled ? buses.ui : 0);
  AudioEngine.setBusGain('sfx', settings.sfxEnabled ? buses.sfx : 0);
  AudioEngine.setBusGain('vo', buses.vo);
  AudioEngine.setBusGain('bgm', settings.bgmEnabled ? buses.bgm : 0);
  if (!settings.bgmEnabled) {
    AudioEngine.stopAllLoops(0.35);
  }
}

/** @deprecated 請改用 `applyAudioSettings` */
export function applyAudioBusSettings(buses: HomeSettings['buses']) {
  applyAudioSettings({
    volume: buses.master,
    buses,
    sfxEnabled: true,
    bgmEnabled: true,
    lang: 'zh-Hant',
  });
}
