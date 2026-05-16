import { useCallback, useEffect, useRef, useState } from 'react';
import { LEVELS as GAME_LEVELS } from '../gameLogic';
import { useMineGame } from './useMineGame';
import { resolveMedalThresholds } from './medalThresholds';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { GameStatusMessageBar, GameStatusPanel } from './GameStatusPanel';
import { CommanderTelegraphRow } from './CommanderPanel';
import { LevelMechanicFeatureBadges } from './levelMechanicFeatureBadges';
import { LevelStrategyGuide, LevelStrategyGuideTrigger } from './LevelStrategyGuide';
import { ChapterEntryBriefingOverlay } from './ChapterEntryBriefingOverlay';
import { VictoryCelebrationOverlay } from './VictoryCelebrationOverlay';
import { getBestMedal, isLevelUnlocked, recordMedal, saveGameProgress } from './gameProgressStorage';
import { chapterCampaignTagline } from './levelStrategyGuideModel';
import { campaignLevelHeaderTitle } from './campaignLevelUi';
import { getStoredHeroId } from '../heroes';
import { useCombatHeroId } from './useCombatHeroId';
import { mergeUnlockedOnChapterCleared } from './heroUnlockedStorage';
import { getHeroCombatTheme } from './heroCombatTheme';
import { LEVELS_PER_CHAPTER, stageInChapter } from './chapterStage';
import { AudioEngine } from '../audio/AudioEngine';
import { useBgmChannel } from '../audio/useBgmChannel';

export type BackToMissionContext = {
  /** 在勝利狀態自章內第 8 關「返回」時，帶出剛完成的章，供上層顯示行動卷宗前對話 */
  dossierAfterClearedChapter?: number;
};

export default function GameView({
  initialLevelIndex: initialLevelProp,
  onBack,
  clearedLevelKeys,
  unlockClearedLevelKeys,
  onClearedLevelKeysChange: _onClearedLevelKeysChange,
}: {
  initialLevelIndex: number;
  onBack: (context?: BackToMissionContext) => void;
  clearedLevelKeys: string[];
  /** 可選：僅用於 isLevelUnlocked／接關前進；存檔仍以 clearedLevelKeys 為準（例：DEV 行動卷宗開放全部章節） */
  unlockClearedLevelKeys?: string[];
  onClearedLevelKeysChange: (next: string[]) => void;
}) {
  useEffect(() => {
    // 戰場掛載時強制收掉選單系 BGM，避免與戰場曲重疊。
    AudioEngine.stopLoop('bgm.home.settings', 0.2);
    AudioEngine.stopLoop('bgm.mission.map', 0.2);
    AudioEngine.stopLoop('bgm.base.ambience', 0.2);
  }, []);

  useBgmChannel('combat');

  const orderedLevelKeys = GAME_LEVELS.map((l) => l.levelKey);
  const unlockBasis = unlockClearedLevelKeys ?? clearedLevelKeys;
  const requestedLevel = GAME_LEVELS[initialLevelProp] ?? GAME_LEVELS[0];
  const isRequestedUnlocked =
    requestedLevel != null && isLevelUnlocked(requestedLevel.levelKey, unlockBasis, orderedLevelKeys);
  const safeInitialLevelIndex = isRequestedUnlocked ? initialLevelProp : 0;

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
    destructivePowerPercentage,
    destructivePowerMineCount,
    destructivePowerTotalCells,
    destructivePowerOverlapExtra,
    bonusFxKeys,
    medalThresholds,
    projectedMedal,
    canEarlySettle,
    requestEarlySettle,
  } = useMineGame(safeInitialLevelIndex);

  const combatHeroId = useCombatHeroId();
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
  /** 勝利在章內第 8 關且尚未進「下一關」時，返回作戰地圖帶出章碼，供上層顯示卷宗前對話。 */
  const chapterBossClearedForDossierRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState?.status !== 'won') return;
    const ch = gameState.level.definition.chapter;
    if (typeof ch !== 'number' || !Number.isFinite(ch)) return;
    if (stageInChapter(gameState.level.stage) !== LEVELS_PER_CHAPTER) return;
    chapterBossClearedForDossierRef.current = ch;
  }, [gameState?.status, gameState?.level.stage, gameState?.level.definition.chapter, gameState?.gameId]);

  const lastGameIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (gameState == null) return;
    if (lastGameIdRef.current != null && lastGameIdRef.current !== gameState.gameId) {
      chapterBossClearedForDossierRef.current = null;
    }
    lastGameIdRef.current = gameState.gameId;
  }, [gameState?.gameId]);

  const handleNextLevel = useCallback(() => {
    if (!gameState) return;
    const ch = gameState.level.definition.chapter;
    if (gameState.status === 'won' && typeof ch === 'number' && stageInChapter(gameState.level.stage) === LEVELS_PER_CHAPTER) {
      chapterBossClearedForDossierRef.current = null;
    }
    const nextIndex = currentLevelIndex + 1;
    const nextLevel = levelList[nextIndex];
    if (!nextLevel) return;

    const effectiveCleared = gameState.status === 'won'
      ? Array.from(new Set([...unlockBasis, gameState.level.levelKey]))
      : unlockBasis;
    if (!isLevelUnlocked(nextLevel.levelKey, effectiveCleared, orderedLevelKeys)) return;
    setCurrentLevelIndex(nextIndex);
  }, [currentLevelIndex, levelList, gameState, unlockBasis, orderedLevelKeys]);

  const handleExitToMission = useCallback(() => {
    const c = chapterBossClearedForDossierRef.current;
    chapterBossClearedForDossierRef.current = null;
    onBack(c != null ? { dossierAfterClearedChapter: c } : undefined);
  }, [onBack]);

  useEffect(() => {
    if (!gameState) return;
    if (gameState.status !== 'won') return;
    if (lastRecordedWinGameId.current === gameState.gameId) return;

    const clearedLevelKey = gameState.level.levelKey;
    const ch = gameState.level.definition.chapter;
    if (typeof ch === 'number' && Number.isFinite(ch) && stageInChapter(gameState.level.stage) === LEVELS_PER_CHAPTER) {
      mergeUnlockedOnChapterCleared(ch);
    }
    const nextClearedLevelKeys = Array.from(new Set([...clearedLevelKeys, clearedLevelKey]));
    if (gameState.settledMedal != null) {
      recordMedal(clearedLevelKey, gameState.settledMedal);
    }
    saveGameProgress({ clearedLevelKeys: nextClearedLevelKeys });
    _onClearedLevelKeysChange(nextClearedLevelKeys);
    getStoredHeroId();
    lastRecordedWinGameId.current = gameState.gameId;
  }, [gameState?.status, gameState?.gameId, gameState?.level.levelKey, gameState?.level.stage, gameState?.settledMedal, clearedLevelKeys, _onClearedLevelKeysChange]);

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

  const isChapterFinalStage =
    gameState.status === 'won' &&
    typeof ch === 'number' &&
    Number.isFinite(ch) &&
    stageInChapter(gameState.level.stage) === LEVELS_PER_CHAPTER;

  const combatTheme = getHeroCombatTheme(combatHeroId);

  return (
    <div
      className={`relative flex min-h-[100dvh] w-full flex-col items-center p-1 font-sans text-slate-300 sm:p-2 md:p-2.5 ${combatTheme.root}`}
    >
      <GameHeader
        destructivePowerPercentage={destructivePowerPercentage}
        destructivePowerMineCount={destructivePowerMineCount}
        destructivePowerTotalCells={destructivePowerTotalCells}
        destructivePowerOverlapExtra={destructivePowerOverlapExtra}
        medalThresholds={medalThresholds ?? resolveMedalThresholds(gameState.level.definition)}
        projectedMedal={projectedMedal}
        showEarlySettleButton={canEarlySettle}
        onEarlySettle={requestEarlySettle}
        onBack={handleExitToMission}
        onRestart={() => initGame(currentLevelIndex)}
        showNextLevelButton={winInlineActionsUnlocked && !isLastLevel && !isChapterFinalStage}
        onNextLevel={handleNextLevel}
        showChapterEndButton={winInlineActionsUnlocked && isChapterFinalStage && !isLastLevel}
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

      <div className="flex w-full max-w-7xl flex-1 flex-col items-stretch min-h-[75dvh]">
        <GameStatusMessageBar
          gameState={gameState}
          statusBarFrameClass={combatTheme.statusBarWrap}
          speakerHeroId={combatHeroId}
          buckEmergencyAvailable={gameState.buckEmergencyAvailable}
          allowPreBattleHeroSwitch={gameState.status === 'playing' && !gameState.timerStarted}
        />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 py-0.5 sm:gap-1.5 sm:py-1">
          <div className="min-w-0 w-full">
            <GameBoard
              boardRef={boardRef}
              gameState={gameState}
              movingSoldier={movingSoldier}
              onCellClick={handleCellClick}
              bonusFxKeys={bonusFxKeys}
              combatHeroId={combatHeroId}
              align="center"
            />
          </div>
        </div>
        <GameStatusPanel
          gameState={gameState}
          currentLevelIndex={currentLevelIndex}
          levelCount={levelList.length}
          fillPercentage={fillPercentage}
          destructivePowerPercentage={destructivePowerPercentage}
          showInlineWinActions={winInlineActionsUnlocked}
          onReturnToMission={handleExitToMission}
          onReplayFinalLevel={() => initGame(currentLevelIndex)}
        />
      </div>

      <VictoryCelebrationOverlay
        visible={showVictoryCelebration}
        variant={isLastLevel ? 'campaign' : 'level'}
        fillPercentage={gameState.settledFillPercentage ?? fillPercentage}
        levelCount={levelList.length}
        onConfirm={() => setDismissedWinCelebrationGameId(gameState.gameId)}
        settledMedal={gameState.settledMedal}
        previousBestMedal={getBestMedal(gameState.level.levelKey)}
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

