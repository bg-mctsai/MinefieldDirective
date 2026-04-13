import { useCallback, useEffect, useRef, useState } from 'react';
import { LEVELS as GAME_LEVELS } from '../gameLogic';
import { useMineGame } from './useMineGame';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { GameStatusMessageBar, GameStatusPanel } from './GameStatusPanel';
import { CommanderTelegraphRow } from './CommanderPanel';
import { CommanderSupportPanel } from './CommanderSupportPanel';
import { LevelMechanicFeatureBadges } from './levelMechanicFeatureBadges';
import { LevelStrategyGuide, LevelStrategyGuideTrigger } from './LevelStrategyGuide';
import { ChapterEntryBriefingOverlay } from './ChapterEntryBriefingOverlay';
import { VictoryCelebrationOverlay } from './VictoryCelebrationOverlay';
import { LEVEL_MAX, isLevelUnlocked, saveGameProgress } from './gameProgressStorage';
import { chapterCampaignTagline } from './levelStrategyGuideModel';
import { campaignLevelHeaderTitle } from './campaignLevelUi';

export default function GameView({
  initialLevelIndex: initialLevelProp,
  onBack,
  highestClearedLevel,
  onHighestClearedLevelChange: _onHighestClearedLevelChange,
}: {
  initialLevelIndex: number;
  onBack: () => void;
  highestClearedLevel: number;
  onHighestClearedLevelChange: (next: number) => void;
}) {
  const requestedLevelId = GAME_LEVELS[initialLevelProp]?.id ?? 1;
  const isRequestedUnlocked = isLevelUnlocked(requestedLevelId, highestClearedLevel);
  const safeInitialLevelId = isRequestedUnlocked ? requestedLevelId : Math.min(LEVEL_MAX, highestClearedLevel + 1);
  const safeInitialLevelIndex = safeInitialLevelId - 1;

  const {
    LEVELS: levelList,
    boardRef,
    currentLevelIndex,
    setCurrentLevelIndex,
    gameState,
    selectedHandIndex,
    selectHand,
    movingSoldier,
    initGame,
    handleCellClick,
    fillPercentage,
    bonusFxKeys,
  } = useMineGame(safeInitialLevelIndex);

  const [chapterBriefingDismissed, setChapterBriefingDismissed] = useState(false);
  const [strategyGuideOpen, setStrategyGuideOpen] = useState(false);
  /** 與 gameId 對齊：按「確定」關閉過關畫面後才顯示內嵌操作列 */
  const [dismissedWinCelebrationGameId, setDismissedWinCelebrationGameId] = useState<number | null>(null);

  useEffect(() => {
    if (gameState?.gameId == null) return;
    setChapterBriefingDismissed(false);
    setStrategyGuideOpen(false);
    setDismissedWinCelebrationGameId(null);
  }, [gameState?.gameId]);

  const lastRecordedWinGameId = useRef<number | null>(null);

  const handleNextLevel = useCallback(() => {
    if (!gameState) return;
    const nextIndex = currentLevelIndex + 1;
    const nextLevel = levelList[nextIndex];
    if (!nextLevel) return;

    const effectiveHighestCleared =
      gameState.status === 'won' ? Math.max(highestClearedLevel, gameState.level.id) : highestClearedLevel;
    if (!isLevelUnlocked(nextLevel.id, effectiveHighestCleared)) return;
    setCurrentLevelIndex(nextIndex);
  }, [currentLevelIndex, levelList, gameState, highestClearedLevel]);

  useEffect(() => {
    if (!gameState) return;
    if (gameState.status !== 'won') return;
    if (lastRecordedWinGameId.current === gameState.gameId) return;

    const clearedLevelId = gameState.level.id;
    const nextHighestCleared = Math.max(highestClearedLevel, clearedLevelId);

    saveGameProgress({ highestClearedLevel: nextHighestCleared });
    _onHighestClearedLevelChange(nextHighestCleared);
    lastRecordedWinGameId.current = gameState.gameId;
  }, [gameState?.status, gameState?.gameId, gameState?.level.id, highestClearedLevel, _onHighestClearedLevelChange]);

  if (!gameState) return null;

  const levelBriefingLines =
    gameState.level.definition.levelEntryBriefing ??
    gameState.level.definition.chapterEntryBriefing ??
    [];
  const ch = gameState.level.definition.chapter;
  const chapterHeading =
    chapterCampaignTagline(ch).trim() || `第 ${ch} 章`;
  const showChapterBriefing =
    gameState.status === 'playing' &&
    levelBriefingLines.length > 0 &&
    !chapterBriefingDismissed;

  const isLastLevel = currentLevelIndex >= levelList.length - 1;
  const showVictoryCelebration =
    gameState.status === 'won' && dismissedWinCelebrationGameId !== gameState.gameId;
  const winInlineActionsUnlocked =
    gameState.status === 'won' && dismissedWinCelebrationGameId === gameState.gameId;
  const useCommanderSupportLayout = gameState.level.definition.chapter === 1;

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-950 p-3 font-sans text-slate-300 selection:bg-amber-500/30 md:p-5">
      <GameHeader
        fillPercentage={fillPercentage}
        coverageGoalPercent={gameState.level.definition.coverageGoal * 100}
        onBack={onBack}
        onRestart={() => initGame(currentLevelIndex, gameState.runSeed)}
        showNextLevelButton={winInlineActionsUnlocked && !isLastLevel}
        onNextLevel={handleNextLevel}
        levelName={campaignLevelHeaderTitle(gameState.level)}
        secondsLeft={gameState.secondsLeft}
        countdownStarted={gameState.timerStarted}
        guideButton={
          <div className="flex max-w-[min(100vw-6rem,36rem)] flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:justify-end">
            <LevelMechanicFeatureBadges definition={gameState.level.definition} />
            <LevelStrategyGuideTrigger onClick={() => setStrategyGuideOpen(true)} />
          </div>
        }
        telegraphPanel={
          <CommanderTelegraphRow
            gameState={gameState}
            selectedHandIndex={selectedHandIndex}
            movingSoldier={movingSoldier}
            onSelectHand={selectHand}
          />
        }
      />

      <LevelStrategyGuide
        level={gameState.level}
        open={strategyGuideOpen}
        onOpenChange={setStrategyGuideOpen}
        showTrigger={false}
      />

      <div className="flex w-full max-w-6xl flex-col items-center">
        <GameStatusMessageBar
          gameState={gameState}
          boardRef={boardRef}
          enableSupportBarrage={!useCommanderSupportLayout}
        />
        <div
          className={`flex w-full gap-4 ${
            useCommanderSupportLayout
              ? 'flex-col items-center lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-6'
              : 'flex-col items-center'
          }`}
        >
          <div
            className={`min-w-0 ${
              useCommanderSupportLayout ? 'flex w-full justify-center lg:justify-center' : 'w-full'
            }`}
          >
            <GameBoard
              boardRef={boardRef}
              gameState={gameState}
              movingSoldier={movingSoldier}
              onCellClick={handleCellClick}
              bonusFxKeys={bonusFxKeys}
              align="center"
            />
          </div>
          {useCommanderSupportLayout && <CommanderSupportPanel gameState={gameState} />}
        </div>
        <GameStatusPanel
          gameState={gameState}
          currentLevelIndex={currentLevelIndex}
          levelCount={levelList.length}
          fillPercentage={fillPercentage}
          showInlineWinActions={winInlineActionsUnlocked}
          onReturnToMission={onBack}
          onReplayFinalLevel={() => initGame(currentLevelIndex, gameState.runSeed)}
        />
      </div>

      <VictoryCelebrationOverlay
        visible={showVictoryCelebration}
        variant={isLastLevel ? 'campaign' : 'level'}
        fillPercentage={fillPercentage}
        levelCount={levelList.length}
        onConfirm={() => setDismissedWinCelebrationGameId(gameState.gameId)}
      />

      <ChapterEntryBriefingOverlay
        visible={showChapterBriefing}
        chapterTitle={chapterHeading}
        chapterToneLines={[]}
        levelBriefingLines={levelBriefingLines}
        onDismiss={() => setChapterBriefingDismissed(true)}
      />
    </div>
  );
}
