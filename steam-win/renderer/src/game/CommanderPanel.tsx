import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { GAME_FIXED, sub } from './gameFixedMessages';
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
  selectedHandIndex: number | null
): string {
  const H = GAME_FIXED.commanderRowHint;
  if (gameState.status === 'exploding') return H.chainExploding;
  if (gameState.status !== 'playing') return H.missionOver;
  const jam = Boolean(gameState.level.definition.commandSlotReceiveJamming && gameState.jammingEpochMs > 0);
  if (selectedHandIndex === null) {
    return jam ? H.selectTelegraphJammingIdle : H.selectTelegraphNormal;
  }
  if (jam) {
    return H.digitLockedPickCell;
  }
  return sub(H.pickTargetCellWithDigit, { digit: gameState.hand[selectedHandIndex] });
}

/** 與「指南」同一列的橫向長官電報列（電碼按鈕尺寸與先前 header 卡一致） */
export function CommanderTelegraphRow({
  gameState,
  selectedHandIndex,
  movingSoldier,
  onSelectHand,
  heroTheme: heroThemeProp,
  combatHeroId = 'xiaoming',
}: {
  gameState: GameState;
  selectedHandIndex: number | null;
  movingSoldier: MovingSoldierState | null;
  onSelectHand: (index: number) => void;
  heroTheme?: HeroCombatTheme;
  /** 用於信號干擾輪播節奏（艾達較慢） */
  combatHeroId?: string;
}) {
  const heroTheme = heroThemeProp ?? getHeroCombatTheme('xiaoming');
  const hint = telegraphHint(gameState, selectedHandIndex);
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
    // 各槽步長不同，用最密節奏重繪（約為最快槽步長的一半）
    const tickMs = Math.max(32, Math.round(jammingStepMs * 0.34));
    const id = window.setInterval(() => setJammingFrame((x) => x + 1), tickMs);
    return () => clearInterval(id);
  }, [jamming, jammingStepMs, gameState.gameId, gameState.jammingEpochMs]);

  return (
    <div
      className={`flex h-full min-h-[2.4rem] min-w-0 flex-1 items-center gap-1.5 rounded-lg border-2 px-1.5 py-1 shadow-md sm:min-h-[2.55rem] sm:gap-2 sm:rounded-xl sm:px-2 sm:py-1.5 sm:shadow-lg md:min-h-[2.65rem] md:rounded-2xl md:shadow-xl ${heroTheme.telegraphWrap}`}
      title={hint}
    >
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-black text-white sm:text-xs md:text-sm">長官電報</span>
          <span className="hidden text-[7px] font-bold uppercase tracking-wide text-slate-500 md:block">
            HQ Telegraph
          </span>
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
        className="grid min-w-0 flex-1 gap-1 sm:gap-1.5 md:gap-2"
        style={{
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        }}
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
            className={`flex aspect-square max-h-[2.55rem] min-h-[2.15rem] w-full min-w-0 items-center justify-center rounded-xl border-2 text-base font-black transition-all sm:max-h-[2.85rem] sm:min-h-[2.35rem] sm:rounded-2xl sm:border-[3px] sm:text-lg md:max-h-[3.1rem] md:text-xl
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
    </div>
  );
}
