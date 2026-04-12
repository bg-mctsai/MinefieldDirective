import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LEVELS } from './gameLogic';
import HomePage from './home/HomePage';
import MissionMap from './MissionMap';
import HeroSelect from './HeroSelect';
import GameView from './game/GameView';
import { isLevelUnlocked, loadGameProgress } from './game/gameProgressStorage';

type Screen = 'home' | 'mission' | 'game' | 'hero';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [gameLevelIndex, setGameLevelIndex] = useState(0);
  const [highestClearedLevel, setHighestClearedLevel] = useState(() => loadGameProgress().highestClearedLevel);
  /** 開發重讀 levels.json／maps 後遞增，強制作戰地圖／對局重掛載 */
  const [levelsReloadToken, setLevelsReloadToken] = useState(0);
  /** 作戰地圖長列表：離開時記住 window 捲動，返回時還原（避免從對局回來要重滑） */
  const missionMapScrollYRef = useRef(0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="min-h-screen"
      >
        {screen === 'home' && (
          <HomePage
            onNavigate={(to) => {
              if (to === 'mission') setScreen('mission');
              if (to === 'hero') setScreen('hero');
            }}
            onDevLevelsReloaded={
              import.meta.env.DEV ? () => setLevelsReloadToken((n) => n + 1) : undefined
            }
          />
        )}
        {screen === 'mission' && (
          <MissionMap
            key={levelsReloadToken}
            scrollRestoreYRef={missionMapScrollYRef}
            onBack={() => {
              missionMapScrollYRef.current = window.scrollY;
              setScreen('home');
            }}
            onStart={(idx) => {
              const level = LEVELS[idx];
              if (!level) return;
              if (!isLevelUnlocked(level.id, highestClearedLevel)) return;
              missionMapScrollYRef.current = window.scrollY;
              setGameLevelIndex(idx);
              setScreen('game');
            }}
            highestClearedLevel={highestClearedLevel}
          />
        )}
        {screen === 'hero' && <HeroSelect onBack={() => setScreen('home')} />}
        {screen === 'game' && (
          <GameView
            key={`${gameLevelIndex}-${levelsReloadToken}`}
            initialLevelIndex={gameLevelIndex}
            highestClearedLevel={highestClearedLevel}
            onHighestClearedLevelChange={setHighestClearedLevel}
            onBack={() => setScreen('mission')}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
