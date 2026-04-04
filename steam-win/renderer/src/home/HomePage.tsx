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
import type { HomeNavigate, HomeSettings } from './types';

export type { HomeNavigate } from './types';

export default function HomePage({ onNavigate }: { onNavigate: (to: HomeNavigate) => void }) {
  const [typed, setTyped] = useState('');
  const [heroId, setHeroId] = useState(getStoredHeroId);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<HomeSettings>(loadHomeSettings);

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

  return (
    <TerminalBackdrop showRadar className="home-terminal font-mono selection:bg-[#F59E0B]/30">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-8 md:py-10">
        <HomeHeader typedTitle={typed} />

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
