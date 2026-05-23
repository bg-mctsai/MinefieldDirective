import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { pickHeroCommanderRowHint } from './heroGameStatusLines';
import {
  effectiveSignalJammingStepMs,
  signalJammingDisplayedDigit,
  signalJammingSlotEnterFromTop,
} from './signalJamming';
import type { GameState, MovingSoldierState } from './types';
import type { HeroCombatTheme } from './heroCombatTheme';
import { getHeroCombatTheme } from './heroCombatTheme';

function telegraphHint(
  gameState: GameState,
  selectedHandIndex: number | null,
  combatHeroId: string,
): string {
  if (gameState.status === 'exploding') {
    return pickHeroCommanderRowHint(combatHeroId, 'chainExploding');
  }
  if (gameState.status !== 'playing') {
    return pickHeroCommanderRowHint(combatHeroId, 'missionOver');
  }
  const jam = Boolean(gameState.level.definition.commandSlotReceiveJamming && gameState.jammingEpochMs > 0);
  if (selectedHandIndex === null) {
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

/** 長官電報：地圖左側直向列（或橫向，供舊版相容） */
export function CommanderTelegraphRow({
  gameState,
  selectedHandIndex,
  movingSoldier,
  onSelectHand,
  heroTheme: heroThemeProp,
  combatHeroId = 'xiaoming',
  layout = 'column',
}: {
  gameState: GameState;
  selectedHandIndex: number | null;
  movingSoldier: MovingSoldierState | null;
  onSelectHand: (index: number) => void;
  heroTheme?: HeroCombatTheme;
  /** 用於信號干擾輪播節奏（艾達較慢） */
  combatHeroId?: string;
  layout?: 'row' | 'column';
}) {
  const heroTheme = heroThemeProp ?? getHeroCombatTheme('xiaoming');
  const hint = telegraphHint(gameState, selectedHandIndex, combatHeroId);
  const n = gameState.hand.length;
  const jamming =
    gameState.status === 'playing' &&
    Boolean(gameState.level.definition.commandSlotReceiveJamming && gameState.jammingEpochMs > 0);

  const jammingStepMs = effectiveSignalJammingStepMs(
    gameState.level.definition.commandSlotJammingStepMs,
    combatHeroId,
  );

  const [, setJammingFrame] = useState(0);
  useEffect(() => {
    if (!jamming) return;
    const tickMs = Math.max(32, Math.round(jammingStepMs * 0.34));
    const id = window.setInterval(() => setJammingFrame((x) => x + 1), tickMs);
    return () => clearInterval(id);
  }, [jamming, jammingStepMs, gameState.gameId, gameState.jammingEpochMs]);

  const isColumn = layout === 'column';
  const shellClass = isColumn
    ? `flex w-[3.35rem] shrink-0 flex-col items-stretch gap-1 rounded-lg border-2 px-1 py-1.5 shadow-md sm:w-[3.65rem] sm:gap-1.5 sm:rounded-xl sm:px-1.5 sm:py-2 sm:shadow-lg md:w-[4rem] md:rounded-2xl md:shadow-xl ${heroTheme.telegraphWrap}`
    : `flex h-full min-h-[2.4rem] min-w-0 flex-1 items-center gap-1.5 rounded-lg border-2 px-1.5 py-1 shadow-md sm:min-h-[2.55rem] sm:gap-2 sm:rounded-xl sm:px-2 sm:py-1.5 sm:shadow-lg md:min-h-[2.65rem] md:rounded-2xl md:shadow-xl ${heroTheme.telegraphWrap}`;

  const digitBtnClass = isColumn
    ? 'flex h-[2.15rem] w-full min-w-0 items-center justify-center rounded-xl border-2 text-base font-black transition-all sm:h-[2.35rem] sm:rounded-2xl sm:border-[3px] sm:text-lg md:h-[2.55rem] md:text-xl'
    : 'flex aspect-square max-h-[2.55rem] min-h-[2.15rem] w-full min-w-0 items-center justify-center rounded-xl border-2 text-base font-black transition-all sm:max-h-[2.85rem] sm:min-h-[2.35rem] sm:rounded-2xl sm:border-[3px] sm:text-lg md:max-h-[3.1rem] md:text-xl';

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
          const displayNum = jamming
            ? lock && lock.slotIndex === idx
              ? lock.value
              : signalJammingDisplayedDigit(
                  gameState.jammingEpochMs,
                  idx,
                  Date.now(),
                  gameState.level.definition.commandSlotJammingStepMs,
                  gameState.level.definition.gridSystem,
                  combatHeroId,
                )
            : num;
          const jammingAnimateDigit =
            jamming && !(lock && lock.slotIndex === idx);
          const enterFromTop = signalJammingSlotEnterFromTop(idx);
          return (
            <motion.button
              key={`${gameState.gameId}-slot-${idx}`}
              type="button"
              whileHover={gameState.status === 'playing' ? { y: -1, scale: 1.02 } : {}}
              whileTap={gameState.status === 'playing' ? { scale: 0.95 } : {}}
              disabled={gameState.status !== 'playing' || movingSoldier !== null}
              onClick={() => onSelectHand(idx)}
              className={`${digitBtnClass}
                ${
                  selectedHandIndex === idx
                    ? heroTheme.telegraphDigitSelected
                    : heroTheme.telegraphDigitIdle
                }
                ${
                  gameState.status !== 'playing' || movingSoldier !== null ? 'cursor-not-allowed opacity-40' : ''
                }
              `}
            >
              {jammingAnimateDigit ? (
                <span className="relative flex h-[1.15em] w-full items-center justify-center overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={`${gameState.gameId}-jam-${idx}-${displayNum}`}
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
        })}
      </div>
    </motion.div>
  );
}
