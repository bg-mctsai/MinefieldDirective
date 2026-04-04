import { useCallback, useEffect, useRef } from 'react';
import { LEVELS as GAME_LEVELS } from '../gameLogic';
import { useMineGame } from './useMineGame';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { GameStatusPanel } from './GameStatusPanel';
import { CommanderPanel } from './CommanderPanel';
import { VictoryOverlay } from './VictoryOverlay';
import { CampaignCompleteOverlay } from './CampaignCompleteOverlay';
import { LevelStrategyGuide } from './LevelStrategyGuide';
import { LEVEL_MAX, isLevelUnlocked, saveGameProgress } from './gameProgressStorage';

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
  } = useMineGame(safeInitialLevelIndex);

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

  /** 勝利覆蓋層：有下一關就進下一關，否則同關再開一局 */
  const handleVictoryContinue = useCallback(() => {
    if (!gameState) return;
    const effectiveHighestCleared = Math.max(highestClearedLevel, gameState.level.id);
    const nextIndex = currentLevelIndex + 1;
    const nextLevel = levelList[nextIndex];
    if (nextLevel && isLevelUnlocked(nextLevel.id, effectiveHighestCleared)) {
      setCurrentLevelIndex(nextIndex);
      return;
    }
    initGame(currentLevelIndex);
  }, [currentLevelIndex, levelList, gameState, highestClearedLevel, initGame]);

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

  const isLastLevel = currentLevelIndex >= levelList.length - 1;
  const showCampaignComplete = gameState.status === 'won' && isLastLevel;
  const showLevelVictoryOverlay = gameState.status === 'won' && !isLastLevel;

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-950 p-4 font-sans text-slate-300 selection:bg-amber-500/30 md:p-8">
      <GameHeader
        fillPercentage={fillPercentage}
        coverageGoalPercent={gameState.level.definition.coverageGoal * 100}
        onBack={onBack}
        onRestart={() => initGame(currentLevelIndex)}
        levelName={gameState.level.name}
        statusMessage={gameState.message}
        secondsLeft={gameState.secondsLeft}
        countdownStarted={gameState.timerStarted}
        commanderPanel={
          <CommanderPanel
            gameState={gameState}
            selectedHandIndex={selectedHandIndex}
            movingSoldier={movingSoldier}
            onSelectHand={selectHand}
          />
        }
      />

      <LevelStrategyGuide level={gameState.level} />

      <div className="flex w-full max-w-6xl flex-col items-center">
        <GameBoard
          boardRef={boardRef}
          gameState={gameState}
          movingSoldier={movingSoldier}
          onCellClick={handleCellClick}
        />
        <GameStatusPanel
          gameState={gameState}
          currentLevelIndex={currentLevelIndex}
          levelCount={levelList.length}
          onNextLevel={handleNextLevel}
          onReturnToMission={onBack}
        />
      </div>

      <VictoryOverlay
        visible={showLevelVictoryOverlay}
        fillPercentage={fillPercentage}
        continueLabel="下一關"
        onContinue={handleVictoryContinue}
      />
      <CampaignCompleteOverlay
        visible={showCampaignComplete}
        fillPercentage={fillPercentage}
        totalLevels={levelList.length}
        onReturnToMission={onBack}
        onReplayFinalLevel={() => initGame(currentLevelIndex)}
      />
    </div>
  );
}
