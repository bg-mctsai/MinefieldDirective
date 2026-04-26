import { useCallback, useEffect, useRef, useState } from 'react';
import { LEVELS as GAME_LEVELS } from '../gameLogic';
import { useMineGame } from './useMineGame';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { GameStatusMessageBar, GameStatusPanel } from './GameStatusPanel';
import { CommanderTelegraphRow } from './CommanderPanel';
import { LevelMechanicFeatureBadges } from './levelMechanicFeatureBadges';
import { LevelStrategyGuide, LevelStrategyGuideTrigger } from './LevelStrategyGuide';
import { ChapterEntryBriefingOverlay } from './ChapterEntryBriefingOverlay';
import { VictoryCelebrationOverlay } from './VictoryCelebrationOverlay';
import { LEVEL_MAX, getBestMedal, isLevelUnlocked, recordMedal, saveGameProgress } from './gameProgressStorage';
import { chapterCampaignTagline } from './levelStrategyGuideModel';
import { campaignLevelHeaderTitle } from './campaignLevelUi';
import { getStoredHeroId } from '../heroes';
import { mergeUnlockedOnChapterCleared } from './heroUnlockedStorage';
import { getHeroCombatTheme } from './heroCombatTheme';
import { stageInChapter } from './chapterStage';
import { AudioEngine } from '../audio/AudioEngine';
import { useBgmChannel } from '../audio/useBgmChannel';

export type BackToMissionContext = {
  /** 在勝利狀態自章內第 10 關「返回」時，帶出剛完成的章，供上層顯示行動卷宗前對話 */
  dossierAfterClearedChapter?: number;
};

export default function GameView({
  initialLevelIndex: initialLevelProp,
  onBack,
  highestClearedLevel,
  onHighestClearedLevelChange: _onHighestClearedLevelChange,
}: {
  initialLevelIndex: number;
  onBack: (context?: BackToMissionContext) => void;
  highestClearedLevel: number;
  onHighestClearedLevelChange: (next: number) => void;
}) {
  useEffect(() => {
    // 戰場掛載時強制收掉選單系 BGM，避免與戰場曲重疊。
    AudioEngine.stopLoop('bgm.home.settings', 0.2);
    AudioEngine.stopLoop('bgm.mission.map', 0.2);
    AudioEngine.stopLoop('bgm.base.ambience', 0.2);
  }, []);

  useBgmChannel('combat');

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
    forceCompleteForTest,
    fillPercentage,
    bonusFxKeys,
    medalThresholds,
    projectedMedal,
    canEarlySettle,
    requestEarlySettle,
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
  /** 勝利在章內第 10 關且尚未進「下一關」時，返回作戰地圖帶出章碼，供上層顯示卷宗前對話。 */
  const chapter10BossClearedForDossierRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState?.status !== 'won') return;
    const ch = gameState.level.definition.chapter;
    if (typeof ch !== 'number' || !Number.isFinite(ch)) return;
    if (stageInChapter(gameState.level.id, ch) !== 10) return;
    chapter10BossClearedForDossierRef.current = ch;
  }, [gameState?.status, gameState?.level.id, gameState?.level.definition.chapter, gameState?.gameId]);

  const lastGameIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (gameState == null) return;
    if (lastGameIdRef.current != null && lastGameIdRef.current !== gameState.gameId) {
      chapter10BossClearedForDossierRef.current = null;
    }
    lastGameIdRef.current = gameState.gameId;
  }, [gameState?.gameId]);

  const handleNextLevel = useCallback(() => {
    if (!gameState) return;
    const ch = gameState.level.definition.chapter;
    if (gameState.status === 'won' && typeof ch === 'number' && stageInChapter(gameState.level.id, ch) === 10) {
      chapter10BossClearedForDossierRef.current = null;
    }
    const nextIndex = currentLevelIndex + 1;
    const nextLevel = levelList[nextIndex];
    if (!nextLevel) return;

    const effectiveHighestCleared =
      gameState.status === 'won' ? Math.max(highestClearedLevel, gameState.level.id) : highestClearedLevel;
    if (!isLevelUnlocked(nextLevel.id, effectiveHighestCleared)) return;
    setCurrentLevelIndex(nextIndex);
  }, [currentLevelIndex, levelList, gameState, highestClearedLevel]);

  const handleExitToMission = useCallback(() => {
    const c = chapter10BossClearedForDossierRef.current;
    chapter10BossClearedForDossierRef.current = null;
    onBack(c != null ? { dossierAfterClearedChapter: c } : undefined);
  }, [onBack]);

  useEffect(() => {
    if (!gameState) return;
    if (gameState.status !== 'won') return;
    if (lastRecordedWinGameId.current === gameState.gameId) return;

    const clearedLevelId = gameState.level.id;
    const ch = gameState.level.definition.chapter;
    if (typeof ch === 'number' && Number.isFinite(ch) && stageInChapter(clearedLevelId, ch) === 10) {
      mergeUnlockedOnChapterCleared(ch);
    }
    const nextHighestCleared = Math.max(highestClearedLevel, clearedLevelId);
    if (gameState.settledMedal != null) {
      recordMedal(clearedLevelId, gameState.settledMedal);
    }
    saveGameProgress({ highestClearedLevel: nextHighestCleared });
    _onHighestClearedLevelChange(nextHighestCleared);
    getStoredHeroId();
    lastRecordedWinGameId.current = gameState.gameId;
  }, [gameState?.status, gameState?.gameId, gameState?.level.id, gameState?.settledMedal, highestClearedLevel, _onHighestClearedLevelChange]);

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

  const isChapterStage10 =
    gameState.status === 'won' &&
    typeof ch === 'number' &&
    Number.isFinite(ch) &&
    stageInChapter(gameState.level.id, ch) === 10;

  const combatHeroId = getStoredHeroId();
  const combatTheme = getHeroCombatTheme(combatHeroId);

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center p-3 font-sans text-slate-300 md:p-5 ${combatTheme.root}`}
    >
      <GameHeader
        fillPercentage={fillPercentage}
        medalThresholds={medalThresholds ?? { bronze: gameState.level.definition.coverageGoal, silver: gameState.level.definition.coverageGoal, gold: gameState.level.definition.coverageGoal }}
        projectedMedal={projectedMedal}
        showEarlySettleButton={canEarlySettle}
        onEarlySettle={requestEarlySettle}
        onBack={handleExitToMission}
        onRestart={() => initGame(currentLevelIndex, gameState.runSeed)}
        showNextLevelButton={winInlineActionsUnlocked && !isLastLevel && !isChapterStage10}
        onNextLevel={handleNextLevel}
        showChapterEndButton={winInlineActionsUnlocked && isChapterStage10 && !isLastLevel}
        onChapterEnd={handleExitToMission}
        levelName={campaignLevelHeaderTitle(gameState.level)}
        secondsLeft={gameState.secondsLeft}
        countdownStarted={gameState.timerStarted}
        heroTheme={combatTheme}
        testCompleteButton={
          gameState.status !== 'won' ? (
            <button
              type="button"
              onClick={forceCompleteForTest}
              className="rounded-xl border border-amber-400/65 bg-amber-500/20 px-3 py-2 text-xs font-black tracking-wide text-amber-200 transition-colors hover:bg-amber-500/30"
            >
              測試完成
            </button>
          ) : null
        }
        guideButton={
          <div className="flex max-w-[min(100vw-6rem,36rem)] flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
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
            heroTheme={combatTheme}
            combatHeroId={combatHeroId}
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
          statusBarFrameClass={combatTheme.statusBarWrap}
          speakerHeroId={combatHeroId}
          buckEmergencyAvailable={gameState.buckEmergencyAvailable}
        />
        <div className="flex w-full flex-col items-center gap-4">
          <div className="min-w-0 w-full">
            <GameBoard
              boardRef={boardRef}
              gameState={gameState}
              movingSoldier={movingSoldier}
              onCellClick={handleCellClick}
              bonusFxKeys={bonusFxKeys}
              align="center"
            />
          </div>
        </div>
        <GameStatusPanel
          gameState={gameState}
          currentLevelIndex={currentLevelIndex}
          levelCount={levelList.length}
          fillPercentage={fillPercentage}
          showInlineWinActions={winInlineActionsUnlocked}
          onReturnToMission={handleExitToMission}
          onReplayFinalLevel={() => initGame(currentLevelIndex, gameState.runSeed)}
        />
      </div>

      <VictoryCelebrationOverlay
        visible={showVictoryCelebration}
        variant={isLastLevel ? 'campaign' : 'level'}
        fillPercentage={gameState.settledFillPercentage ?? fillPercentage}
        levelCount={levelList.length}
        onConfirm={() => setDismissedWinCelebrationGameId(gameState.gameId)}
        settledMedal={gameState.settledMedal}
        previousBestMedal={getBestMedal(gameState.level.id)}
        secondsLeft={gameState.settledSecondsLeft}
        timeLimit={gameState.level.definition.timeLimit}
        medalThresholds={medalThresholds}
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

