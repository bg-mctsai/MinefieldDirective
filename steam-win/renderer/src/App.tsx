import { useState } from 'react';
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
          />
        )}
        {screen === 'mission' && (
          <MissionMap
            onBack={() => setScreen('home')}
            onStart={(idx) => {
              const level = LEVELS[idx];
              if (!level) return;
              if (!isLevelUnlocked(level.id, highestClearedLevel)) return;
              setGameLevelIndex(idx);
              setScreen('game');
            }}
            highestClearedLevel={highestClearedLevel}
          />
        )}
        {screen === 'hero' && <HeroSelect onBack={() => setScreen('home')} />}
        {screen === 'game' && (
          <GameView
            key={gameLevelIndex}
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
