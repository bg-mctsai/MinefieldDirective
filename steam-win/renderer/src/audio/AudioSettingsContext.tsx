import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AudioEngine } from './AudioEngine';
import { applyAudioSettings } from './applyAudioSettings';
import { loadHomeSettings, saveHomeSettings } from '../home/homeSettingsStorage';
import type { HomeSettings } from '../home/types';

type AudioSettingsContextValue = {
  settings: HomeSettings;
  setSettings: (next: HomeSettings | ((prev: HomeSettings) => HomeSettings)) => void;
  toggleBgm: () => void;
  toggleSfx: () => void;
};

const AudioSettingsContext = createContext<AudioSettingsContextValue | null>(null);

export function AudioSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<HomeSettings>(() => loadHomeSettings());

  useEffect(() => {
    void AudioEngine.warmUp();
    applyAudioSettings(loadHomeSettings());
  }, []);

  useEffect(() => {
    saveHomeSettings(settings);
    applyAudioSettings(settings);
  }, [settings]);

  const toggleBgm = useCallback(() => {
    setSettings((prev) => ({ ...prev, bgmEnabled: !prev.bgmEnabled }));
  }, []);

  const toggleSfx = useCallback(() => {
    setSettings((prev) => ({ ...prev, sfxEnabled: !prev.sfxEnabled }));
  }, []);

  const value = useMemo(
    () => ({ settings, setSettings, toggleBgm, toggleSfx }),
    [settings, toggleBgm, toggleSfx],
  );

  return <AudioSettingsContext.Provider value={value}>{children}</AudioSettingsContext.Provider>;
}

export function useAudioSettings(): AudioSettingsContextValue {
  const ctx = useContext(AudioSettingsContext);
  if (!ctx) {
    throw new Error('useAudioSettings must be used within AudioSettingsProvider');
  }
  return ctx;
}
