import { useCallback, useEffect, useMemo, useState } from 'react';
import { TerminalBackdrop } from '../ui/TerminalBackdrop';
import { HEROES, getStoredHeroId, setStoredHeroId } from '../heroes';
import { AudioEngine } from '../audio/AudioEngine';
import { applyAudioBusSettings } from '../audio/applyAudioSettings';
import { useBgmChannel } from '../audio/useBgmChannel';
import { HOME_TITLE_FULL } from './constants';
import { HomeHeader } from './HomeHeader';
import { HomeMainMenu } from './HomeMainMenu';
import { HomeOpsDashboard } from './HomeOpsDashboard';
import { HeroSpotlight } from './HeroSpotlight';
import { SettingsModal } from './SettingsModal';
import { BaseAmbience } from './BaseAmbience';
import { loadHomeSettings, saveHomeSettings } from './homeSettingsStorage';
import { devReloadLevelsFromJson } from '../dev/reloadLevelsJson';
import type { HomeNavigate, HomeSettings } from './types';

export type { HomeNavigate } from './types';

export default function HomePage({
  onNavigate,
  onDevLevelsReloaded,
}: {
  onNavigate: (to: HomeNavigate) => void;
  /** 開發：重讀 levels.json + maps/*.json 成功後呼叫，讓作戰地圖／對局掛載新資料 */
  onDevLevelsReloaded?: () => void;
}) {
  const [typed, setTyped] = useState('');
  const [heroId, setHeroId] = useState(() => getStoredHeroId());
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<HomeSettings>(loadHomeSettings);
  const [devReloadBusy, setDevReloadBusy] = useState(false);
  const [devReloadHint, setDevReloadHint] = useState<string | null>(null);

  const hero = useMemo(() => HEROES.find((h) => h.id === heroId) ?? HEROES[0], [heroId]);

  useEffect(() => {
    saveHomeSettings(settings);
    applyAudioBusSettings(settings.buses);
  }, [settings]);

  // HomePage 重新掛載時（例如從對局/作戰地圖返回）強制恢復 ctx + 套一次 bus 設定
  useEffect(() => {
    void AudioEngine.warmUp();
    applyAudioBusSettings(loadHomeSettings().buses);
  }, []);

  // 有些平台需要一次明確的使用者手勢才能解除音訊封鎖，
  // 這裡在首頁首次互動時主動喚醒並啟動主場 BGM，避免「要先開設定才有聲」。
  useEffect(() => {
    const unlockAndStart = () => {
      void AudioEngine.warmUp();
      void AudioEngine.startLoop('bgm.home.settings');
    };
    window.addEventListener('pointerdown', unlockAndStart, { once: true });
    window.addEventListener('keydown', unlockAndStart, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAndStart);
      window.removeEventListener('keydown', unlockAndStart);
    };
  }, []);

  useBgmChannel(settingsOpen ? 'settings' : 'base');

  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(HOME_TITLE_FULL.slice(0, i));
      if (i >= HOME_TITLE_FULL.length) window.clearInterval(id);
    }, 52);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const lines = hero.lines;
    const id = window.setInterval(() => {
      setQuoteIdx((p) => (p + 1) % lines.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [hero.lines]);

  const onMenuHover = useCallback(() => {}, []);

  const handleDevReloadLevels = useCallback(async () => {
    setDevReloadBusy(true);
    setDevReloadHint(null);
    const r = await devReloadLevelsFromJson();
    setDevReloadBusy(false);
    if (r.ok) {
      setDevReloadHint(`已載入 ${r.levelCount} 關`);
      onDevLevelsReloaded?.();
    } else {
      setDevReloadHint(r.error);
    }
    window.setTimeout(() => setDevReloadHint(null), 4500);
  }, [onDevLevelsReloaded]);

  return (
    <TerminalBackdrop showRadar className="home-terminal font-mono selection:bg-[#F59E0B]/30">
      <BaseAmbience />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-8 md:py-10">
        <HomeHeader
          typedTitle={typed}
          devReload={
            import.meta.env.DEV
              ? { onClick: handleDevReloadLevels, busy: devReloadBusy, hint: devReloadHint }
              : undefined
          }
        />

        <section className="relative mt-8 flex-1">
          <div className="pointer-events-none absolute inset-x-4 top-1/2 hidden -translate-y-1/2 lg:block">
            <div className="absolute left-[25%] right-[28%] top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />
            <div className="absolute left-[34%] top-[-9.5rem] h-[19rem] w-px bg-gradient-to-b from-transparent via-[#F59E0B]/20 to-transparent" />
            <div className="absolute right-[27%] top-[-9.5rem] h-[19rem] w-px bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent" />
            <div className="absolute left-[33%] top-[-7rem] h-56 w-56 rounded-full border border-emerald-400/10" />
            <div className="absolute right-[20%] top-[-6rem] h-48 w-48 rounded-full border border-[#F59E0B]/10" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
            <HomeMainMenu
              onNavigate={onNavigate}
              onMenuHover={onMenuHover}
              onOpenSettings={() => setSettingsOpen(true)}
            />
            <HomeOpsDashboard />
            <HeroSpotlight
              hero={hero}
              heroId={heroId}
              quoteIdx={quoteIdx}
              onPickHero={(id) => {
                setHeroId(id);
                setStoredHeroId(id);
                setQuoteIdx(0);
              }}
            />
          </div>

          <div className="pointer-events-none mt-4 hidden rounded-2xl border border-slate-800/80 bg-slate-950/35 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-600 lg:flex lg:items-center lg:justify-between">
            <span>Signal Route // Campaign</span>
            <span>Loadout Sync // Hero Channel</span>
            <span>Minefield Directive // Ready</span>
          </div>
        </section>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        onResetHero={() => setHeroId(getStoredHeroId())}
      />
    </TerminalBackdrop>
  );
}
