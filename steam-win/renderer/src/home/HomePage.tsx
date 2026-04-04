import { useCallback, useEffect, useMemo, useState } from 'react';
import { TerminalBackdrop } from '../ui/TerminalBackdrop';
import { HEROES, getStoredHeroId, setStoredHeroId } from '../heroes';
import { playHoverBeep } from '../playHoverBeep';
import { HOME_TITLE_FULL } from './constants';
import { HomeHeader } from './HomeHeader';
import { HomeMainMenu } from './HomeMainMenu';
import { HeroSpotlight } from './HeroSpotlight';
import { SettingsModal } from './SettingsModal';
import { loadHomeSettings, saveHomeSettings } from './homeSettingsStorage';
import { devReloadLevelsFromJson } from '../dev/reloadLevelsJson';
import type { HomeNavigate, HomeSettings } from './types';

export type { HomeNavigate } from './types';

export default function HomePage({
  onNavigate,
  onDevLevelsReloaded,
}: {
  onNavigate: (to: HomeNavigate) => void;
  /** 開發：重讀 levels.json 成功後呼叫，讓作戰地圖／對局掛載新資料 */
  onDevLevelsReloaded?: () => void;
}) {
  const [typed, setTyped] = useState('');
  const [heroId, setHeroId] = useState(getStoredHeroId);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<HomeSettings>(loadHomeSettings);
  const [devReloadBusy, setDevReloadBusy] = useState(false);
  const [devReloadHint, setDevReloadHint] = useState<string | null>(null);

  const hero = useMemo(() => HEROES.find((h) => h.id === heroId) ?? HEROES[0], [heroId]);

  useEffect(() => {
    saveHomeSettings(settings);
  }, [settings]);

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

  const onMenuHover = useCallback(() => {
    playHoverBeep(settings.volume);
  }, [settings.volume]);

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
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-8 md:py-10">
        <HomeHeader
          typedTitle={typed}
          devReload={
            import.meta.env.DEV
              ? { onClick: handleDevReloadLevels, busy: devReloadBusy, hint: devReloadHint }
              : undefined
          }
        />

        <div className="mt-8 grid flex-1 grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
          <HomeMainMenu
            onNavigate={onNavigate}
            onMenuHover={onMenuHover}
            onOpenSettings={() => setSettingsOpen(true)}
          />
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
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        onResetHero={() => setHeroId(HEROES[0].id)}
      />
    </TerminalBackdrop>
  );
}
