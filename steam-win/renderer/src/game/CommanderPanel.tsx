import { AnimatePresence, motion } from 'motion/react';
import { memo, useEffect, useRef, useState } from 'react';
import { pickHeroCommanderRowHint } from './heroGameStatusLines';
import {
  signalJammingDisplayedDigit,
  signalJammingSlotEnterFromTop,
} from './signalJamming';
import type { GameState, MovingSoldierState } from './types';
import type { HeroCombatTheme } from './heroCombatTheme';
import { getHeroCombatTheme } from './heroCombatTheme';

/**
 * 信號干擾輪播顯示數字：共用 rAF 取樣，僅在任一槽數字真的變更時 setState。
 * 鎖定值仍由 selectHand 用同一套 signalJammingDisplayedDigit(Date.now()) 計算，與此無關。
 */
function useSignalJammingDigits(
  active: boolean,
  epochMs: number,
  slotCount: number,
  stepMs: number | undefined,
  gridSystem: GameState['level']['definition']['gridSystem'],
  combatHeroId: string,
): number[] | null {
  const [digits, setDigits] = useState<number[] | null>(null);
  const lastKeyRef = useRef('');

  useEffect(() => {
    if (!active || slotCount <= 0) {
      lastKeyRef.current = '';
      setDigits(null);
      return;
    }

    let raf = 0;
    const sample = (now: number): number[] => {
      const next = new Array<number>(slotCount);
      for (let i = 0; i < slotCount; i++) {
        next[i] = signalJammingDisplayedDigit(epochMs, i, now, stepMs, gridSystem, combatHeroId);
      }
      return next;
    };

    const publishIfChanged = (next: number[]) => {
      const key = next.join(',');
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;
      setDigits(next);
    };

    publishIfChanged(sample(Date.now()));

    const loop = () => {
      publishIfChanged(sample(Date.now()));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [active, epochMs, slotCount, stepMs, gridSystem, combatHeroId]);

  return digits;
}

function telegraphHint(
  gameState: GameState,
  selectedHandIndex: number | null,
  combatHeroId: string,
  laozhangCopySlotSelected: boolean,
): string {
  if (gameState.status === 'exploding') {
    return pickHeroCommanderRowHint(combatHeroId, 'chainExploding');
  }
  if (gameState.status !== 'playing') {
    return pickHeroCommanderRowHint(combatHeroId, 'missionOver');
  }
  const jam = Boolean(gameState.level.definition.commandSlotReceiveJamming && gameState.jammingEpochMs > 0);
  if (laozhangCopySlotSelected && gameState.laozhangCopiedValue !== null) {
    return pickHeroCommanderRowHint(combatHeroId, 'pickTargetCellWithCopyDigit', {
      digit: gameState.laozhangCopiedValue,
      uses: gameState.laozhangCopiedUsesRemaining,
    });
  }
  if (selectedHandIndex === null) {
    if (
      combatHeroId === 'laozhang' &&
      gameState.laozhangCopiedUsesRemaining > 0 &&
      gameState.laozhangCopiedValue !== null
    ) {
      return pickHeroCommanderRowHint(combatHeroId, 'copySlotReadyToPaste');
    }
    return pickHeroCommanderRowHint(
      combatHeroId,
      jam ? 'selectTelegraphJammingIdle' : 'selectTelegraphNormal',
    );
  }
  if (jam) {
    return pickHeroCommanderRowHint(combatHeroId, 'digitLockedPickCell');
  }
  return pickHeroCommanderRowHint(combatHeroId, 'pickTargetCellWithDigit', {
    digit: gameState.hand[selectedHandIndex]!,
  });
}

const digitBtnClassColumn =
  'flex h-[2.15rem] w-full min-w-0 items-center justify-center rounded-xl border-2 text-base font-black transition-all sm:h-[2.35rem] sm:rounded-2xl sm:border-[3px] sm:text-lg md:h-[2.55rem] md:text-xl';
const digitBtnClassRow =
  'flex aspect-square max-h-[2.55rem] min-h-[2.15rem] w-full min-w-0 items-center justify-center rounded-xl border-2 text-base font-black transition-all sm:max-h-[2.85rem] sm:min-h-[2.35rem] sm:rounded-2xl sm:border-[3px] sm:text-lg md:max-h-[3.1rem] md:text-xl';

const TelegraphHandButton = memo(function TelegraphHandButton({
  slotIndex,
  staticNum,
  gameId,
  status,
  movingSoldier,
  selected,
  disabled,
  heroTheme,
  isColumn,
  jamming,
  jamDisplayDigit,
  lockedValue,
  onSelect,
}: {
  slotIndex: number;
  staticNum: number;
  gameId: number;
  status: GameState['status'];
  movingSoldier: MovingSoldierState | null;
  selected: boolean;
  disabled: boolean;
  heroTheme: HeroCombatTheme;
  isColumn: boolean;
  jamming: boolean;
  /** 干擾輪播當前顯示數字（由父層共用 rAF 推送）；鎖定時傳鎖定值 */
  jamDisplayDigit: number | null;
  lockedValue: number | null;
  onSelect: (index: number) => void;
}) {
  const digitBtnClass = isColumn ? digitBtnClassColumn : digitBtnClassRow;
  const jammingAnimateDigit = jamming && lockedValue === null;
  const enterFromTop = signalJammingSlotEnterFromTop(slotIndex);

  const displayNum =
    lockedValue !== null
      ? lockedValue
      : jamming
        ? (jamDisplayDigit ?? staticNum)
        : staticNum;

  return (
    <motion.button
      type="button"
      whileHover={status === 'playing' ? { y: -1, scale: 1.02 } : {}}
      whileTap={status === 'playing' ? { scale: 0.95 } : {}}
      disabled={disabled}
      onClick={() => onSelect(slotIndex)}
      className={`${digitBtnClass}
        ${selected ? heroTheme.telegraphDigitSelected : heroTheme.telegraphDigitIdle}
        ${disabled ? 'cursor-not-allowed opacity-40' : ''}
      `}
    >
      {jammingAnimateDigit ? (
        <span className="relative flex h-[1.15em] w-full items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${gameId}-jam-${slotIndex}-${displayNum}`}
              initial={{ y: enterFromTop ? '-85%' : '85%', opacity: 0.25 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: enterFromTop ? '85%' : '-85%', opacity: 0.2 }}
              transition={{ duration: 0.11, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-center font-black tabular-nums"
            >
              {displayNum}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : (
        displayNum
      )}
    </motion.button>
  );
});

/** 長官電報：地圖左側直向列（或橫向，供舊版相容） */
export function CommanderTelegraphRow({
  gameState,
  selectedHandIndex,
  movingSoldier,
  onSelectHand,
  heroTheme: heroThemeProp,
  combatHeroId = 'xiaoming',
  layout = 'column',
  laozhangCopySlotSelected = false,
  onLaozhangCopySlotClick,
}: {
  gameState: GameState;
  selectedHandIndex: number | null;
  movingSoldier: MovingSoldierState | null;
  onSelectHand: (index: number) => void;
  heroTheme?: HeroCombatTheme;
  /** 用於信號干擾輪播節奏（艾達較慢） */
  combatHeroId?: string;
  layout?: 'row' | 'column';
  laozhangCopySlotSelected?: boolean;
  onLaozhangCopySlotClick?: () => void;
}) {
  const heroTheme = heroThemeProp ?? getHeroCombatTheme('xiaoming');
  const hint = telegraphHint(gameState, selectedHandIndex, combatHeroId, laozhangCopySlotSelected);
  const n = gameState.hand.length;
  const jamming =
    gameState.status === 'playing' &&
    Boolean(gameState.level.definition.commandSlotReceiveJamming && gameState.jammingEpochMs > 0);
  const jamDigits = useSignalJammingDigits(
    jamming,
    gameState.jammingEpochMs,
    n,
    gameState.level.definition.commandSlotJammingStepMs,
    gameState.level.definition.gridSystem,
    combatHeroId,
  );

  const isColumn = layout === 'column';
  const shellClass = isColumn
    ? `flex w-[3.35rem] shrink-0 flex-col items-stretch gap-1 rounded-lg border-2 px-1 py-1.5 shadow-md sm:w-[3.65rem] sm:gap-1.5 sm:rounded-xl sm:px-1.5 sm:py-2 sm:shadow-lg md:w-[4rem] md:rounded-2xl md:shadow-xl ${heroTheme.telegraphWrap}`
    : `flex h-full min-h-[2.4rem] min-w-0 flex-1 items-center gap-1.5 rounded-lg border-2 px-1.5 py-1 shadow-md sm:min-h-[2.55rem] sm:gap-2 sm:rounded-xl sm:px-2 sm:py-1.5 sm:shadow-lg md:min-h-[2.65rem] md:rounded-2xl md:shadow-xl ${heroTheme.telegraphWrap}`;

  const telegraphDisabled = gameState.status !== 'playing' || movingSoldier !== null;

  return (
    <motion.div className={shellClass} title={hint}>
      <div
        className={`flex shrink-0 ${isColumn ? 'flex-col items-center gap-0.5' : 'items-center gap-1 sm:gap-1.5'}`}
      >
        <div className={`flex flex-col leading-none ${isColumn ? 'items-center text-center' : ''}`}>
          <span className="text-[10px] font-black text-white sm:text-xs md:text-sm">電報</span>
          {!isColumn && (
            <span className="hidden text-[7px] font-bold uppercase tracking-wide text-slate-500 md:block">
              HQ Telegraph
            </span>
          )}
        </div>
        <div className="flex gap-0.5 sm:gap-1">
          <motion.div
            animate={gameState.placedInTurn >= 1 ? { scale: [1, 1.2, 1] } : {}}
            className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 ${
              gameState.placedInTurn >= 1 ? 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-800'
            }`}
          />
          <motion.div
            animate={gameState.placedInTurn >= 2 ? { scale: [1, 1.2, 1] } : {}}
            className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 ${
              gameState.placedInTurn >= 2 ? 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-800'
            }`}
          />
        </div>
      </div>

      <div
        className={
          isColumn
            ? 'flex min-w-0 flex-col gap-1 sm:gap-1.5'
            : 'grid min-w-0 flex-1 gap-1 sm:gap-1.5 md:gap-2'
        }
        style={isColumn ? undefined : { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {gameState.hand.map((num, idx) => {
          const lock = gameState.jammingLockedSlot;
          const lockedValue = lock && lock.slotIndex === idx ? lock.value : null;
          const jamDisplayDigit =
            lockedValue !== null
              ? lockedValue
              : jamming
                ? (jamDigits?.[idx] ??
                  signalJammingDisplayedDigit(
                    gameState.jammingEpochMs,
                    idx,
                    Date.now(),
                    gameState.level.definition.commandSlotJammingStepMs,
                    gameState.level.definition.gridSystem,
                    combatHeroId,
                  ))
                : null;
          return (
            <TelegraphHandButton
              key={`${gameState.gameId}-slot-${idx}`}
              slotIndex={idx}
              staticNum={num}
              gameId={gameState.gameId}
              status={gameState.status}
              movingSoldier={movingSoldier}
              selected={selectedHandIndex === idx}
              disabled={telegraphDisabled}
              heroTheme={heroTheme}
              isColumn={isColumn}
              jamming={jamming}
              jamDisplayDigit={jamDisplayDigit}
              lockedValue={lockedValue}
              onSelect={onSelectHand}
            />
          );
        })}
        {combatHeroId === 'laozhang' && onLaozhangCopySlotClick ? (
          <motion.button
            type="button"
            whileHover={gameState.status === 'playing' ? { y: -1, scale: 1.02 } : {}}
            whileTap={gameState.status === 'playing' ? { scale: 0.95 } : {}}
            disabled={telegraphDisabled}
            onClick={onLaozhangCopySlotClick}
            className={`${isColumn ? digitBtnClassColumn : digitBtnClassRow} relative mt-0.5 border-dashed
              ${
                laozhangCopySlotSelected
                  ? heroTheme.telegraphDigitSelected
                  : selectedHandIndex !== null
                    ? 'border-orange-400/80 bg-orange-950/40 text-orange-200 hover:bg-orange-900/50'
                    : gameState.laozhangCopiedUsesRemaining > 0
                      ? heroTheme.telegraphDigitIdle
                      : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-orange-500/50 hover:text-orange-300'
              }
              ${telegraphDisabled ? 'cursor-not-allowed opacity-40' : ''}
            `}
            title={
              selectedHandIndex !== null
                ? '點此壓箱已選電碼（可用 3 次）'
                : gameState.laozhangCopiedUsesRemaining > 0
                  ? `壓箱槽：${gameState.laozhangCopiedValue}（剩 ${gameState.laozhangCopiedUsesRemaining} 次）`
                  : '壓箱槽：先選電碼再點此壓箱'
            }
          >
            {gameState.laozhangCopiedUsesRemaining > 0 && gameState.laozhangCopiedValue !== null ? (
              <span className="flex flex-col items-center leading-none">
                <span className="font-black tabular-nums">{gameState.laozhangCopiedValue}</span>
                <span className="text-[8px] font-bold text-orange-300/90 sm:text-[9px]">
                  ×{gameState.laozhangCopiedUsesRemaining}
                </span>
              </span>
            ) : (
              <span className="text-[10px] font-black tracking-wider sm:text-xs">壓箱</span>
            )}
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
}
