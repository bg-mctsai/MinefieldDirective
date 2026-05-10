import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TerminalBackdrop } from '../ui/TerminalBackdrop';
import { HEROES, getStoredHeroId, setStoredHeroId } from '../heroes';
import { AudioEngine } from '../audio/AudioEngine';
import { applyAudioBusSettings } from '../audio/applyAudioSettings';
import { useBgmChannel } from '../audio/useBgmChannel';
import { HomeHeader } from './HomeHeader';
import { HomeMainMenu } from './HomeMainMenu';
import { HomeOpsDashboard } from './HomeOpsDashboard';
import { HeroSpotlight } from './HeroSpotlight';
import { SettingsModal } from './SettingsModal';
import { BaseAmbience } from './BaseAmbience';
import { loadHomeSettings, saveHomeSettings } from './homeSettingsStorage';
import { devReloadLevelsFromJson } from '../dev/reloadLevelsJson';
import type { HomeNavigateHandler, HomeSettings } from './types';

export type { HomeNavigate, HomeNavigateOptions, HomeNavigateHandler } from './types';

export default function HomePage({
  onNavigate,
  onDevLevelsReloaded,
}: {
  onNavigate: HomeNavigateHandler;
  /** 開發：重讀 levels.json + maps/*.json 成功後呼叫，讓作戰地圖／對局掛載新資料 */
  onDevLevelsReloaded?: () => void;
}) {
  const [heroId, setHeroId] = useState(() => getStoredHeroId());
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<HomeSettings>(loadHomeSettings);
  const [devReloadBusy, setDevReloadBusy] = useState(false);
  const [devReloadHint, setDevReloadHint] = useState<string | null>(null);
  const devReloadHintTimerRef = useRef<number | null>(null);

  const hero = useMemo(() => HEROES.find((h) => h.id === heroId) ?? HEROES[0], [heroId]);

  useEffect(
    () => () => {
      if (devReloadHintTimerRef.current != null) {
        window.clearTimeout(devReloadHintTimerRef.current);
        devReloadHintTimerRef.current = null;
      }
    },
    [],
  );

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
    if (devReloadHintTimerRef.current != null) {
      window.clearTimeout(devReloadHintTimerRef.current);
      devReloadHintTimerRef.current = null;
    }
    const r = await devReloadLevelsFromJson();
    setDevReloadBusy(false);
    if (r.ok) {
      setDevReloadHint(`已載入 ${r.levelCount} 關`);
      onDevLevelsReloaded?.();
    } else {
      setDevReloadHint(r.error);
    }
    devReloadHintTimerRef.current = window.setTimeout(() => {
      setDevReloadHint(null);
      devReloadHintTimerRef.current = null;
    }, 4500);
  }, [onDevLevelsReloaded]);

  return (
    <TerminalBackdrop showRadar className="home-terminal font-mono selection:bg-[#F59E0B]/30">
      <BaseAmbience />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[min(97vw,1820px)] flex-col px-5 py-4 md:px-10 md:py-6 xl:px-12">
        <div className="pointer-events-none absolute inset-2 animate-pulse rounded-[2rem] border border-cyan-300/30 shadow-[0_0_0_1px_rgba(30,64,175,0.4),0_0_52px_rgba(14,116,144,0.28)] [animation-duration:2.8s] md:inset-3" />
        <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] border border-amber-400/20 shadow-[0_0_28px_rgba(251,191,36,0.1)] md:inset-5" />
        <div className="pointer-events-none absolute left-5 top-5 h-5 w-16 border-l-2 border-t-2 border-cyan-300/55 md:left-7 md:top-7" />
        <div className="pointer-events-none absolute right-5 top-5 h-5 w-16 border-r-2 border-t-2 border-cyan-300/55 md:right-7 md:top-7" />
        <div className="pointer-events-none absolute bottom-5 left-5 h-5 w-16 border-b-2 border-l-2 border-cyan-300/55 md:bottom-7 md:left-7" />
        <div className="pointer-events-none absolute bottom-5 right-5 h-5 w-16 border-b-2 border-r-2 border-cyan-300/55 md:bottom-7 md:right-7" />
        <HomeHeader
          devReload={
            import.meta.env.DEV
              ? { onClick: handleDevReloadLevels, busy: devReloadBusy, hint: devReloadHint }
              : undefined
          }
        />

        <section className="relative mt-0 flex-1 md:mt-0.5">
          <div className="pointer-events-none absolute inset-x-4 top-1/2 hidden -translate-y-1/2 lg:block">
            <div className="absolute left-[25%] right-[28%] top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />
            <div className="absolute left-[34%] top-[-9.5rem] h-[19rem] w-px bg-gradient-to-b from-transparent via-[#F59E0B]/20 to-transparent" />
            <div className="absolute right-[27%] top-[-9.5rem] h-[19rem] w-px bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent" />
            <div className="absolute left-[33%] top-[-7rem] h-56 w-56 rounded-full border border-emerald-400/10" />
            <div className="absolute right-[20%] top-[-6rem] h-48 w-48 rounded-full border border-[#F59E0B]/10" />
          </div>

          <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-start xl:gap-8">
            <HomeMainMenu
              onNavigate={onNavigate}
              onMenuHover={onMenuHover}
              onOpenSettings={() => setSettingsOpen(true)}
            />
            <HomeOpsDashboard onNavigate={onNavigate} />
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
