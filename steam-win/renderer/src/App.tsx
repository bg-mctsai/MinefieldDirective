import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LEVELS } from './gameLogic';
import HomePage from './home/HomePage';
import MissionMap from './MissionMap';
import HeroSelect from './HeroSelect';
import GameView from './game/GameView';
import { isLevelUnlocked, loadGameProgress } from './game/gameProgressStorage';
import { effectiveMissionClearedLevelKeys } from './missionMapDevUnlock';
import { setDevUnlockAllHeroes as setHeroDevUnlockAllOverride } from './heroDevUnlock';
import { LEVELS_PER_CHAPTER, stageInChapter } from './game/chapterStage';
import DossierPostChapter10Gate from './DossierPostChapter10Gate';
import { HeroPortraitLightboxProvider } from './home/HeroPortraitLightbox';

type Screen = 'home' | 'mission' | 'game' | 'hero' | 'dossierGate';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [gameLevelIndex, setGameLevelIndex] = useState(0);
  const [clearedLevelKeys, setClearedLevelKeys] = useState(() => loadGameProgress().clearedLevelKeys);
  /** DEV：行動卷宗一鍵開放全部章節；再按還原真實進度 */
  const [devMissionUnlockAllChapters, setDevMissionUnlockAllChapters] = useState(false);
  /** DEV：幹員個人檔案一鍵視同全部解鎖 */
  const [devUnlockAllHeroes, setDevUnlockAllHeroes] = useState(false);
  /** 開發重讀 levels.json／maps 後遞增，強制作戰地圖／對局重掛載 */
  const [levelsReloadToken, setLevelsReloadToken] = useState(0);
  /** 作戰地圖長列表：離開時記住 window 捲動，返回時還原（避免從對局回來要重滑） */
  const missionMapScrollYRef = useRef(0);
  /** 從對局返回作戰地圖時直接開該章關卡列表；從首頁進入則為 null（章節選擇） */
  const [missionInitialChapter, setMissionInitialChapter] = useState<number | null>(null);
  /** 從章內第 8 關勝利返回前，攔截一層行動卷宗前對話 */
  const [dossierGateChapter, setDossierGateChapter] = useState<number | null>(null);

  const missionClearedLevelKeys = effectiveMissionClearedLevelKeys(
    clearedLevelKeys,
    import.meta.env.DEV && devMissionUnlockAllChapters,
    LEVELS.map((l) => l.levelKey),
  );

  return (
    <HeroPortraitLightboxProvider>
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="min-h-screen min-w-[360px]"
      >
        {screen === 'home' && (
          <HomePage
            onNavigate={(to, options) => {
              if (to === 'mission') {
                setMissionInitialChapter(options?.missionOpenChapter ?? null);
                setScreen('mission');
              }
              if (to === 'hero') setScreen('hero');
            }}
            onDevLevelsReloaded={
              import.meta.env.DEV ? () => setLevelsReloadToken((n) => n + 1) : undefined
            }
          />
        )}
        {screen === 'dossierGate' && dossierGateChapter != null && (
          <DossierPostChapter10Gate
            completedChapter={dossierGateChapter}
            onConfirm={() => {
              setDossierGateChapter(null);
              setMissionInitialChapter(null);
              setScreen('mission');
            }}
          />
        )}
        {screen === 'mission' && (
          <MissionMap
            key={levelsReloadToken}
            initialOpenChapter={missionInitialChapter}
            scrollRestoreYRef={missionMapScrollYRef}
            onBack={() => {
              missionMapScrollYRef.current = window.scrollY;
              setScreen('home');
            }}
            onStart={(idx) => {
              const level = LEVELS[idx];
              if (!level) return;
              if (!isLevelUnlocked(level.levelKey, missionClearedLevelKeys, LEVELS.map((l) => l.levelKey))) return;
              missionMapScrollYRef.current = window.scrollY;
              setGameLevelIndex(idx);
              setScreen('game');
            }}
            clearedLevelKeys={missionClearedLevelKeys}
            devMissionChapterUnlockToggle={
              import.meta.env.DEV
                ? {
                    unlockAllActive: devMissionUnlockAllChapters,
                    onToggleUnlockAll: () => setDevMissionUnlockAllChapters((v) => !v),
                  }
                : undefined
            }
          />
        )}
        {screen === 'hero' && (
          <HeroSelect
            onBack={() => setScreen('home')}
            devHeroUnlockToggle={
              import.meta.env.DEV
                ? {
                    unlockAllActive: devUnlockAllHeroes,
                    onToggleUnlockAll: () =>
                      setDevUnlockAllHeroes((v) => {
                        const next = !v;
                        setHeroDevUnlockAllOverride(next);
                        return next;
                      }),
                  }
                : undefined
            }
          />
        )}
        {screen === 'game' && (
          <GameView
            key={`${gameLevelIndex}-${levelsReloadToken}`}
            initialLevelIndex={gameLevelIndex}
            clearedLevelKeys={clearedLevelKeys}
            unlockClearedLevelKeys={
              import.meta.env.DEV && devMissionUnlockAllChapters ? missionClearedLevelKeys : undefined
            }
            onClearedLevelKeysChange={setClearedLevelKeys}
            onBack={(context) => {
              if (context?.dossierAfterClearedChapter != null) {
                setDossierGateChapter(context.dossierAfterClearedChapter);
                setScreen('dossierGate');
                return;
              }
              const lv = LEVELS[gameLevelIndex];
              const ch = lv?.definition.chapter;
              const stageBoss =
                lv != null && typeof ch === 'number' && Number.isFinite(ch)
                  ? stageInChapter(lv.stage) === LEVELS_PER_CHAPTER
                  : false;
              /** 章內第 8 關已通關：回到行動卷宗，不再自動展開該章戰術地圖 */
              const backToDossier =
                stageBoss && lv != null && clearedLevelKeys.includes(lv.levelKey);
              setMissionInitialChapter(
                backToDossier ? null : typeof ch === 'number' && Number.isFinite(ch) ? ch : null
              );
              setScreen('mission');
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
    </HeroPortraitLightboxProvider>
  );
}
