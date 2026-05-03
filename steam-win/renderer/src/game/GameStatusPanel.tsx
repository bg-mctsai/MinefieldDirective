import { motion, AnimatePresence } from 'motion/react';
import { Check, Crown, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { GameState } from './types';
import { useDynamicHeroBarrage, type HeroBarrageOut } from './useDynamicHeroBarrage';
import { HeroAvatarSilhouette } from '../home/HeroAvatarSilhouette';
import { useHeroPortraitLightbox } from '../home/HeroPortraitLightbox';
import { getHeroDef } from '../heroes';
import { getHeroSkillBriefPanels } from './heroSkillBriefContent';
import { TeletypeInline } from '../teletype';

function messageColorClass(status: GameState['status']): string {
  if (status === 'lost' || status === 'exploding') return 'text-red-500';
  if (status === 'won') return 'text-emerald-500';
  return 'text-slate-300';
}

function messageCaretClass(status: GameState['status']): string {
  if (status === 'lost' || status === 'exploding') return 'bg-red-400/90';
  if (status === 'won') return 'bg-emerald-400/90';
  return 'bg-slate-400/85';
}

function SupportBarrageSpeech({ barrage, gameId }: { barrage: HeroBarrageOut; gameId: number }) {
  const resetKey = `${gameId}-${barrage.id}`;
  const caretCls = barrage.tone === 'alert' ? 'bg-red-200/85' : 'bg-slate-100/80';
  return (
    <p
      className={`max-w-[min(76vw,30rem)] whitespace-nowrap text-center text-[14px] font-semibold italic tracking-[0.01em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-[15px] ${
        barrage.tone === 'alert' ? 'text-red-200' : 'text-slate-100/92'
      }`}
    >
      <TeletypeInline full={barrage.text} resetKey={resetKey} caretClassName={caretCls} />
    </p>
  );
}

/** 地圖上方狀態台詞：單行、極窄寬時可橫向捲動 */
export function GameStatusMessageBar({
  gameState,
  boardRef,
  enableSupportBarrage = true,
  statusBarFrameClass = 'border-slate-700/90 bg-slate-900/95',
  speakerHeroId,
  buckEmergencyAvailable = true,
}: {
  gameState: GameState;
  boardRef: RefObject<HTMLDivElement | null>;
  /** 是否啟用棋盤下方飄字工兵台詞 */
  enableSupportBarrage?: boolean;
  /** 狀態訊息外框（依幹員主題） */
  statusBarFrameClass?: string;
  /** 顯示在訊息左側的幹員頭像（對白） */
  speakerHeroId?: string;
  /** 老張「加固模組」是否仍可用（僅 laozhang 時有意義） */
  buckEmergencyAvailable?: boolean;
}) {
  const { openPortrait } = useHeroPortraitLightbox();
  const dynamicBarrage = useDynamicHeroBarrage(gameState);
  /** 棋盤下方飄字：與 hook 同步；victory 僅用上方訊息列（見 useDynamicHeroBarrage 註解） */
  const supportBarrage: HeroBarrageOut | null =
    enableSupportBarrage && dynamicBarrage != null && dynamicBarrage.trigger !== 'victory'
      ? dynamicBarrage
      : null;
  const [boardAnchor, setBoardAnchor] = useState<{ left: number; top: number } | null>(null);
  const [skillBriefOpen, setSkillBriefOpen] = useState(false);
  const [skillBriefPos, setSkillBriefPos] = useState<{ top: number; left: number } | null>(null);
  const avatarSkillBtnRef = useRef<HTMLButtonElement>(null);

  const closeSkillBrief = useCallback(() => {
    setSkillBriefOpen(false);
    setSkillBriefPos(null);
  }, []);

  const syncSkillBriefPos = useCallback(() => {
    if (!skillBriefOpen) return;
    const el = avatarSkillBtnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelW = Math.min(352, window.innerWidth - 24);
    let left = r.left;
    if (left + panelW > window.innerWidth - 12) left = Math.max(12, window.innerWidth - 12 - panelW);
    if (left < 12) left = 12;
    const maxH = Math.min(window.innerHeight * 0.7, 416);
    let top = r.bottom + 8;
    if (top + maxH > window.innerHeight - 12) top = Math.max(12, r.top - maxH - 8);
    setSkillBriefPos({ top, left });
  }, [skillBriefOpen]);

  useEffect(() => {
    if (!skillBriefOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSkillBrief();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skillBriefOpen, closeSkillBrief]);

  useEffect(() => {
    setSkillBriefOpen(false);
    setSkillBriefPos(null);
  }, [gameState.gameId]);

  useLayoutEffect(() => {
    syncSkillBriefPos();
  }, [syncSkillBriefPos, gameState.message]);

  useEffect(() => {
    if (!skillBriefOpen) return;
    syncSkillBriefPos();
    window.addEventListener('resize', syncSkillBriefPos);
    window.addEventListener('scroll', syncSkillBriefPos, true);
    return () => {
      window.removeEventListener('resize', syncSkillBriefPos);
      window.removeEventListener('scroll', syncSkillBriefPos, true);
    };
  }, [skillBriefOpen, syncSkillBriefPos]);

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

  const skillPanels =
    speakerHeroId != null ? getHeroSkillBriefPanels(speakerHeroId, buckEmergencyAvailable) : [];
  const speakerName = speakerHeroId != null ? getHeroDef(speakerHeroId).name : '';
  const statusMessage = dynamicBarrage?.text ?? gameState.message ?? '';
  const statusMsgKey = `${gameState.gameId}|||${statusMessage}`;

  return (
    <div className="relative mb-3 w-full max-w-7xl shrink-0">
      {skillBriefOpen && speakerHeroId != null && (
        <>
          <div role="presentation" className="fixed inset-0 z-[100] bg-black/50" onClick={closeSkillBrief} />
          {skillBriefPos != null && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="hero-skill-brief-heading"
              style={{ top: skillBriefPos.top, left: skillBriefPos.left }}
              className="fixed z-[101] w-[min(28rem,calc(100vw-1.5rem))] max-h-[min(76vh,34rem)] overflow-y-auto rounded-2xl border-2 border-slate-600 bg-slate-900/98 p-5 shadow-2xl backdrop-blur-sm"
            >
              <div className="mb-4 flex flex-col items-center gap-2 border-b border-slate-700/80 pb-4">
                <button
                  type="button"
                  title="再點一次全螢幕放大頭像"
                  aria-label="全螢幕放大頭像"
                  onClick={() => openPortrait(speakerHeroId)}
                  className="relative cursor-zoom-in rounded-2xl outline-none ring-offset-2 ring-offset-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500/80"
                >
                  <HeroAvatarSilhouette heroId={speakerHeroId} size={120} />
                  <span
                    className="pointer-events-none absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-amber-500/55 bg-slate-950/95 text-[11px] font-black leading-none text-amber-400 ring-1 ring-black/45"
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                <p className="text-center text-sm font-bold text-slate-300">{getHeroDef(speakerHeroId).role}</p>
              </div>
              <div className="mb-3 flex items-start justify-between gap-2">
                <h2 id="hero-skill-brief-heading" className="text-lg font-black tracking-tight text-white">
                  {speakerName} · 被動／作戰說明
                </h2>
                <button
                  type="button"
                  onClick={closeSkillBrief}
                  className="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  aria-label="關閉"
                >
                  <X size={18} strokeWidth={2.25} />
                </button>
              </div>
              <div className="space-y-4">
                {skillPanels.map((p) => (
                  <div key={p.title}>
                    <div className="mb-1.5 text-sm font-black uppercase tracking-[0.08em] text-amber-300">
                      {p.title}
                    </div>
                    {p.paragraphs.map((line, i) => (
                      <p key={i} className="text-base font-semibold leading-relaxed text-slate-200">
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={statusMsgKey}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="w-full"
        >
          <div className={`rounded-xl border px-4 py-2 shadow-md ${statusBarFrameClass}`}>
            <div
              className={`flex min-w-0 items-center gap-2.5 sm:gap-3 ${speakerHeroId ? 'pb-2' : ''} ${speakerHeroId ? '' : 'justify-center'}`}
            >
              {speakerHeroId ? (
                <button
                  ref={avatarSkillBtnRef}
                  type="button"
                  title="查看大頭像與被動／作戰說明"
                  className="relative shrink-0 self-center cursor-pointer rounded-2xl outline-none ring-offset-2 ring-offset-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500/80"
                  aria-expanded={skillBriefOpen}
                  aria-haspopup="dialog"
                  aria-label={`查看${speakerName}大頭像與被動／作戰說明`}
                  onClick={() => setSkillBriefOpen((v) => !v)}
                >
                  <HeroAvatarSilhouette heroId={speakerHeroId} size={48} />
                  <span
                    className="pointer-events-none absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-amber-500/40 bg-slate-950/95 text-amber-400 shadow-md ring-1 ring-black/40"
                    aria-hidden
                  >
                    <span className="text-[11px] font-black leading-none">+</span>
                  </span>
                </button>
              ) : null}
              <div className="min-w-0 flex-1 overflow-x-auto [-webkit-overflow-scrolling:touch]">
                <p
                  className={`whitespace-nowrap text-base font-bold leading-snug sm:text-lg ${speakerHeroId ? 'text-left' : 'text-center'} ${messageColorClass(gameState.status)}`}
                >
                  <TeletypeInline
                    full={statusMessage}
                    resetKey={statusMsgKey}
                    caretClassName={messageCaretClass(gameState.status)}
                  />
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {supportBarrage && (
          <motion.div
            key={`${gameState.gameId}-${supportBarrage.id}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 0.95, y: -10 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 4.4, ease: 'linear' }}
            className="pointer-events-none fixed z-20"
            style={{
              left: `${boardAnchor?.left ?? window.innerWidth / 2}px`,
              top: `${(boardAnchor?.top ?? 12) + supportBarrage.lane * 18}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className={`rounded-md px-3 py-1 ${
                supportBarrage.tone === 'alert'
                  ? 'ops-alert-pulse border border-red-500/60 bg-red-500/15'
                  : ''
              }`}
            >
              <SupportBarrageSpeech barrage={supportBarrage} gameId={gameState.gameId} />
            </div>
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
  destructivePowerPercentage,
  showInlineWinActions,
  onReturnToMission,
  onReplayFinalLevel,
}: {
  gameState: GameState;
  currentLevelIndex: number;
  levelCount: number;
  fillPercentage: number;
  destructivePowerPercentage: number;
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
    <div className="mt-3 w-full max-w-7xl">
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
                      已完成 {levelCount} 關 · 破壞力{' '}
                      <span className="font-bold text-emerald-400">{destructivePowerPercentage.toFixed(1)}%</span>
                      {' '}
                      <span className="text-slate-500">（覆蓋 {fillPercentage.toFixed(1)}%）</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={onReturnToMission}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 shadow-sm transition-all hover:bg-amber-400 active:scale-[0.98] sm:flex-none sm:min-w-[7.5rem] sm:text-sm"
                  >
                    <Check size={16} strokeWidth={2.5} />
                    完結
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
