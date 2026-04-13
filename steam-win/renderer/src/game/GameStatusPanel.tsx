import { motion, AnimatePresence } from 'motion/react';
import { Crown, Map } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { GameState } from './types';

function messageColorClass(status: GameState['status']): string {
  if (status === 'lost' || status === 'exploding') return 'text-red-500';
  if (status === 'won') return 'text-emerald-500';
  return 'text-slate-300';
}

/** 地圖上方狀態台詞：單行、極窄寬時可橫向捲動 */
export function GameStatusMessageBar({
  gameState,
  boardRef,
  enableSupportBarrage = true,
}: {
  gameState: GameState;
  boardRef: RefObject<HTMLDivElement | null>;
  enableSupportBarrage?: boolean;
}) {
  const isLv1 = gameState.level.id === 1;
  const prevStatusRef = useRef<GameState['status']>(gameState.status);
  const supportCooldownUntilRef = useRef(0);
  const hasShownOpeningRef = useRef(false);
  const hasShownLast10Ref = useRef(false);
  const [supportBarrage, setSupportBarrage] = useState<{ id: number; text: string; lane: number } | null>(null);
  const [boardAnchor, setBoardAnchor] = useState<{ left: number; top: number } | null>(null);

  const pushSupport = (text: string) => {
    const now = Date.now();
    if (now < supportCooldownUntilRef.current) return;
    supportCooldownUntilRef.current = now + 9000;
    setSupportBarrage({
      id: now,
      text,
      lane: Math.floor(Math.random() * 3), // 3 軌道，避免每次都卡同一行
    });
  };

  useEffect(() => {
    prevStatusRef.current = gameState.status;
  }, [gameState.status]);

  useEffect(() => {
    hasShownOpeningRef.current = false;
    hasShownLast10Ref.current = false;
    supportCooldownUntilRef.current = 0;
    setSupportBarrage(null);
  }, [gameState.gameId]);

  useEffect(() => {
    if (!enableSupportBarrage) {
      setSupportBarrage(null);
      return;
    }
    if (!isLv1) {
      setSupportBarrage(null);
      return;
    }
    if (gameState.status === 'won') {
      pushSupport('很好，就照這樣活下去。你剛剛那套節奏，能把人帶回來。');
      return;
    }

    if (gameState.status === 'playing') {
      // 避免與章節簡報重疊：只有玩家真的開始操作（timerStarted）才出第一句
      if (gameState.timerStarted && !hasShownOpeningRef.current) {
        hasShownOpeningRef.current = true;
        pushSupport('長官在這裡。先選電報，再落點；慢一點沒關係，我不要你亂。');
      }
      if (
        gameState.timerStarted &&
        gameState.secondsLeft !== null &&
        gameState.secondsLeft <= 10 &&
        !hasShownLast10Ref.current
      ) {
        hasShownLast10Ref.current = true;
        pushSupport('別慌，我看著你。先做最穩的那一步，我們還能把這關帶過去。');
      }
      return;
    }

    const prevStatus = prevStatusRef.current;
    if (
      (gameState.status === 'exploding' || gameState.status === 'lost') &&
      prevStatus === 'playing'
    ) {
      pushSupport('沒事，這次算我陪你校正。人沒折在這裡就好，下一輪我們重來。');
    }
  }, [
    enableSupportBarrage,
    isLv1,
    gameState.status,
    gameState.secondsLeft,
    gameState.timerStarted,
    gameState.gameId,
  ]);

  useEffect(() => {
    if (!supportBarrage) return;
    const id = window.setTimeout(() => setSupportBarrage(null), 4200);
    return () => window.clearTimeout(id);
  }, [supportBarrage]);

  useEffect(() => {
    const syncAnchor = () => {
      const el = boardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setBoardAnchor({
        left: rect.left + rect.width / 2,
        top: rect.bottom + 8,
      });
    };

    syncAnchor();
    window.addEventListener('resize', syncAnchor);
    window.addEventListener('scroll', syncAnchor, true);
    return () => {
      window.removeEventListener('resize', syncAnchor);
      window.removeEventListener('scroll', syncAnchor, true);
    };
  }, [boardRef, gameState.gameId]);

  return (
    <div className="relative mb-2 w-full max-w-6xl shrink-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState.message}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="w-full"
        >
          <div className="rounded-xl border border-slate-700/90 bg-slate-900/95 px-3 py-1.5 shadow-md">
            <div className="min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <p
                className={`whitespace-nowrap text-center text-[13px] font-bold leading-snug sm:text-sm ${messageColorClass(gameState.status)}`}
              >
                {gameState.message}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {supportBarrage && (
          <motion.div
            key={`${gameState.gameId}-${supportBarrage.id}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 0.9, y: -10 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 4.4, ease: 'linear' }}
            className="pointer-events-none fixed z-20"
            style={{
              left: `${boardAnchor?.left ?? window.innerWidth / 2}px`,
              top: `${(boardAnchor?.top ?? 12) + supportBarrage.lane * 18}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="max-w-[min(76vw,30rem)] whitespace-nowrap text-center text-[14px] font-semibold italic tracking-[0.01em] text-slate-100/92 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-[15px]">
              {supportBarrage.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GameStatusPanel({
  gameState,
  currentLevelIndex,
  levelCount,
  fillPercentage,
  showInlineWinActions,
  onReturnToMission,
  onReplayFinalLevel,
}: {
  gameState: GameState;
  currentLevelIndex: number;
  levelCount: number;
  fillPercentage: number;
  /** 過關慶祝按「確定」後才顯示最終關操作列 */
  showInlineWinActions: boolean;
  onReturnToMission?: () => void;
  onReplayFinalLevel?: () => void;
}) {
  const isFinalLevel = currentLevelIndex >= levelCount - 1;
  /** 非最終關的「下一關」改在 GameHeader；此處僅保留最終關操作列 */
  const showWinPanel =
    showInlineWinActions &&
    gameState.status === 'won' &&
    isFinalLevel &&
    Boolean(onReturnToMission);

  return (
    <div className="mt-2 w-full max-w-6xl">
      <AnimatePresence>
        {showWinPanel && (
          <motion.div
            key="won-panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            {isFinalLevel && onReturnToMission && (
              <div className="flex flex-col gap-2 rounded-xl border-2 border-amber-400/85 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-3 py-2.5 shadow-md shadow-amber-950/20 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 ring-2 ring-amber-400/35">
                    <Crown size={20} className="text-amber-400" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 sm:text-[11px]">
                      戰役全破
                    </p>
                    <p className="text-sm font-black leading-tight text-white sm:text-base">恭喜破關！</p>
                    <p className="text-[11px] font-medium leading-tight text-slate-400 sm:text-xs">
                      已完成 {levelCount} 關 · 覆蓋率{' '}
                      <span className="font-bold text-emerald-400">{fillPercentage.toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={onReturnToMission}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 shadow-sm transition-all hover:bg-amber-400 active:scale-[0.98] sm:flex-none sm:min-w-[7.5rem] sm:text-sm"
                  >
                    <Map size={15} strokeWidth={2.5} />
                    作戰地圖
                  </button>
                  {onReplayFinalLevel && (
                    <button
                      type="button"
                      onClick={onReplayFinalLevel}
                      className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/90 px-3 py-2 text-xs font-black text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-800 active:scale-[0.98] sm:flex-none sm:min-w-[7.5rem] sm:text-sm"
                    >
                      再挑戰
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
