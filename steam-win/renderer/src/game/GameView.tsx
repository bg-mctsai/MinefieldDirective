import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LEVELS as GAME_LEVELS } from '../gameLogic';
import { useMineGame } from './useMineGame';
import { resolveMedalThresholds } from './medalThresholds';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { GameStatusMessageBar, GameStatusPanel } from './GameStatusPanel';
import { CommanderTelegraphRow } from './CommanderPanel';
import { HeroSkillHud } from './HeroSkillHud';
import { computeBobbyPlaceHints, isBobbySniffTurn } from './bobbyScentMark';
import { LevelMechanicFeatureBadges } from './levelMechanicFeatureBadges';
import { LevelStrategyGuide, LevelStrategyGuideTrigger } from './LevelStrategyGuide';
import { ChapterEntryBriefingOverlay } from './ChapterEntryBriefingOverlay';
import { VictoryCelebrationOverlay } from './VictoryCelebrationOverlay';
import { getBestMedal, isLevelUnlocked, recordMedal, saveGameProgress } from './gameProgressStorage';
import { chapterCampaignTagline } from './levelStrategyGuideModel';
import { campaignLevelHeaderTitle } from './campaignLevelUi';
import { getStoredHeroId } from '../heroes';
import { useCombatHeroId } from './useCombatHeroId';
import { HeroUnlockDialogueOverlay } from './HeroUnlockDialogueOverlay';
import { mergeUnlockedOnChapterCleared } from './heroUnlockedStorage';
import { filterHeroIdsWithUnlockDialogue } from '../levelData/heroUnlockDialogue';
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
    laozhangCopySlotSelected,
    selectLaozhangCopySlot,
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
    bobbyDownshiftFx,
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
  /** 本章末剛解鎖、待戰後通話的幹員（勝利慶祝關閉後播放） */
  const [pendingUnlockHeroIds, setPendingUnlockHeroIds] = useState<string[]>([]);
  const [unlockDialogueDismissed, setUnlockDialogueDismissed] = useState(false);

  useEffect(() => {
    if (gameState?.gameId == null) return;
    setChapterBriefingDismissed(false);
    setStrategyGuideOpen(false);
    setDismissedWinCelebrationGameId(null);
    setPendingUnlockHeroIds([]);
    setUnlockDialogueDismissed(false);
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
      const newly = mergeUnlockedOnChapterCleared(ch);
      const withDialogue = filterHeroIdsWithUnlockDialogue(newly);
      if (withDialogue.length > 0) {
        setPendingUnlockHeroIds(withDialogue);
        setUnlockDialogueDismissed(false);
      }
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

  const bobbyPlaceHintKeys = useMemo(() => {
    if (combatHeroId !== 'bobby' || selectedHandIndex === null || !gameState) return null;
    if (gameState.status !== 'playing') return null;
    if (!isBobbySniffTurn(gameState.placedInTurn)) return null;

    const jamActive =
      Boolean(gameState.level.definition.commandSlotReceiveJamming) &&
      gameState.jammingEpochMs > 0;
    let telegramValue: number;
    if (jamActive) {
      const lock = gameState.jammingLockedSlot;
      if (!lock || lock.slotIndex !== selectedHandIndex) return new Set<string>();
      telegramValue = lock.value;
    } else {
      telegramValue = gameState.hand[selectedHandIndex];
    }
    if (telegramValue === undefined) return new Set<string>();

    const placed = gameState.placedNumbers;
    if (placed.length === 0) return new Set<string>();
    const last = placed[placed.length - 1];
    const blastKeys = new Set(
      (gameState.level.definition.blastPoints ?? []).map((bp) => `${bp.pos[0]},${bp.pos[1]}`),
    );
    const hints = computeBobbyPlaceHints(
      last.x,
      last.y,
      telegramValue,
      gameState.level,
      placed,
      gameState.revealedMines,
      gameState.dynamicMines,
      blastKeys,
    );
    return new Set(hints.map((c) => `${c.x},${c.y}`));
  }, [
    combatHeroId,
    selectedHandIndex,
    gameState?.gameId,
    gameState?.status,
    gameState?.placedNumbers,
    gameState?.revealedMines,
    gameState?.dynamicMines,
    gameState?.level,
    gameState?.hand,
    gameState?.jammingLockedSlot,
    gameState?.jammingEpochMs,
    gameState?.placedInTurn,
  ]);

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
  const winCelebrationDismissed =
    gameState.status === 'won' && dismissedWinCelebrationGameId === gameState.gameId;
  const hasPendingUnlockDialogue =
    pendingUnlockHeroIds.length > 0 && !unlockDialogueDismissed;
  const showHeroUnlockDialogue = winCelebrationDismissed && hasPendingUnlockDialogue;
  const winInlineActionsUnlocked = winCelebrationDismissed && !hasPendingUnlockDialogue;

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
        statusMessagePanel={
          <GameStatusMessageBar
            gameState={gameState}
            statusBarFrameClass={combatTheme.statusBarWrap}
            speakerHeroId={combatHeroId}
            fortifyRemaining={gameState.fortifyRemaining}
            laozhangCopiedValue={gameState.laozhangCopiedValue}
            laozhangCopiedUsesRemaining={gameState.laozhangCopiedUsesRemaining}
            bobbyDownshiftRemaining={gameState.bobbyDownshiftRemaining}
            allowPreBattleHeroSwitch={gameState.status === 'playing' && !gameState.timerStarted}
            placement="header"
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
        <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-1 py-0.5 sm:gap-1.5 sm:py-1">
          <div className="flex w-full min-w-0 justify-center">
            <div className="inline-flex max-w-full items-start gap-0.5 sm:gap-1">
              <CommanderTelegraphRow
                layout="column"
                gameState={gameState}
                selectedHandIndex={selectedHandIndex}
                movingSoldier={movingSoldier}
                onSelectHand={selectHand}
                heroTheme={combatTheme}
                combatHeroId={combatHeroId}
                laozhangCopySlotSelected={laozhangCopySlotSelected}
                onLaozhangCopySlotClick={selectLaozhangCopySlot}
              />
              <GameBoard
                boardRef={boardRef}
                gameState={gameState}
                movingSoldier={movingSoldier}
                onCellClick={handleCellClick}
                bonusFxKeys={bonusFxKeys}
                bobbyDownshiftFx={bobbyDownshiftFx}
                combatHeroId={combatHeroId}
                placeHintKeys={bobbyPlaceHintKeys}
                align="left"
              />
              <HeroSkillHud
                heroId={combatHeroId}
                fortifyRemaining={gameState.fortifyRemaining}
                laozhangCopiedValue={gameState.laozhangCopiedValue}
                laozhangCopiedUsesRemaining={gameState.laozhangCopiedUsesRemaining}
                laozhangCopySlotSelected={laozhangCopySlotSelected}
                handSelected={selectedHandIndex !== null}
                bobbyDownshiftRemaining={gameState.bobbyDownshiftRemaining}
                theme={combatTheme}
              />
            </div>
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

      <HeroUnlockDialogueOverlay
        visible={showHeroUnlockDialogue}
        heroIds={pendingUnlockHeroIds}
        onComplete={() => setUnlockDialogueDismissed(true)}
      />

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

