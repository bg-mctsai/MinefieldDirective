import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, Crown, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GameState } from './types';
import { useDynamicHeroBarrage } from './useDynamicHeroBarrage';
import { HeroAvatarSilhouette } from '../home/HeroAvatarSilhouette';
import { useHeroPortraitLightbox } from '../home/HeroPortraitLightbox';
import { HEROES, getHeroDef, setStoredHeroId } from '../heroes';
import { loadUnlockedHeroIds } from './heroUnlockedStorage';
import { getHeroSkillBriefPanels } from './heroSkillBriefContent';
import { TeletypeInline } from '../teletype';
import { GAME_HEADER_MESSAGE_CARD_CLASS } from './GameHeader';

const SKILL_BRIEF_AVATAR_SIZE = 168;

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

/** 角色訊息：header 與火力並排（預留兩行）；或舊版地圖上方單行 */
export function GameStatusMessageBar({
  gameState,
  statusBarFrameClass = 'border-slate-700/90 bg-slate-900/95',
  speakerHeroId,
  buckEmergencyAvailable = true,
  bobbyDownshiftAvailable = true,
  allowPreBattleHeroSwitch = false,
  placement = 'header',
}: {
  gameState: GameState;
  /** 狀態訊息外框（依幹員主題） */
  statusBarFrameClass?: string;
  /** 顯示在訊息左側的幹員頭像（對白） */
  speakerHeroId?: string;
  /** 老張「加固模組」是否仍可用（僅 laozhang 時有意義） */
  buckEmergencyAvailable?: boolean;
  /** 波比「緊急降碼」本組電報是否仍可用 */
  bobbyDownshiftAvailable?: boolean;
  /** 倒數未啟動前：技能說明彈層可左右切換已解鎖幹員 */
  allowPreBattleHeroSwitch?: boolean;
  /** header：右上與火力並排；above-board：地圖上方（單行橫捲） */
  placement?: 'header' | 'above-board';
}) {
  const inHeader = placement === 'header';
  const { openPortrait } = useHeroPortraitLightbox();
  const dynamicBarrage = useDynamicHeroBarrage(gameState);
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

  /** 動態台詞優先帶出該句的 heroId，否則用目前出戰幹員 */
  const displaySpeakerId = dynamicBarrage?.heroId ?? speakerHeroId;
  const skillPanels =
    displaySpeakerId != null
      ? getHeroSkillBriefPanels(displaySpeakerId, buckEmergencyAvailable, bobbyDownshiftAvailable)
      : [];
  const speakerName = displaySpeakerId != null ? getHeroDef(displaySpeakerId).name : '';
  const statusMessage = dynamicBarrage?.text ?? gameState.message ?? '';
  const statusMsgKey = `${gameState.gameId}|||${statusMessage}`;

  const pickableHeroes = useMemo(() => {
    const unlockedHeroIds = new Set(loadUnlockedHeroIds());
    const unlocked = HEROES.filter((h) => unlockedHeroIds.has(h.id));
    return unlocked.length > 0 ? unlocked : [HEROES[0]];
  }, []);
  const briefHeroIndex = Math.max(
    0,
    displaySpeakerId != null ? pickableHeroes.findIndex((h) => h.id === displaySpeakerId) : 0,
  );
  const canCycleBriefHero =
    allowPreBattleHeroSwitch && pickableHeroes.length > 1 && displaySpeakerId != null;
  const pickRelativeBriefHero = useCallback(
    (delta: number) => {
      if (!canCycleBriefHero) return;
      const next =
        pickableHeroes[(briefHeroIndex + delta + pickableHeroes.length) % pickableHeroes.length];
      if (next) setStoredHeroId(next.id);
    },
    [briefHeroIndex, canCycleBriefHero, pickableHeroes],
  );

  return (
    <div
      className={`relative w-full ${inHeader ? 'h-full min-h-0' : 'mb-1 max-w-7xl shrink-0 sm:mb-1.5'}`}
    >
      {skillBriefOpen && displaySpeakerId != null && (
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
              <motion.div className="mb-4 flex flex-col items-center gap-2 border-b border-slate-700/80 pb-4">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => pickRelativeBriefHero(-1)}
                    disabled={!canCycleBriefHero}
                    className="rounded-xl border border-slate-600/90 bg-slate-950/70 p-2 text-slate-400 transition-colors hover:border-amber-500/60 hover:text-amber-400 disabled:cursor-default disabled:opacity-25"
                    aria-label="上一名幹員"
                  >
                    <ChevronLeft size={22} strokeWidth={2.25} />
                  </button>
                  <button
                    type="button"
                    title="再點一次全螢幕放大頭像"
                    aria-label="全螢幕放大頭像"
                    onClick={() => openPortrait(displaySpeakerId)}
                    className="relative shrink-0 cursor-zoom-in rounded-2xl outline-none ring-offset-2 ring-offset-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500/80"
                  >
                    <HeroAvatarSilhouette heroId={displaySpeakerId} size={SKILL_BRIEF_AVATAR_SIZE} />
                    <span
                      className="pointer-events-none absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/55 bg-slate-950/95 text-xs font-black leading-none text-amber-400 ring-1 ring-black/45"
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => pickRelativeBriefHero(1)}
                    disabled={!canCycleBriefHero}
                    className="rounded-xl border border-slate-600/90 bg-slate-950/70 p-2 text-slate-400 transition-colors hover:border-amber-500/60 hover:text-amber-400 disabled:cursor-default disabled:opacity-25"
                    aria-label="下一名幹員"
                  >
                    <ChevronRight size={22} strokeWidth={2.25} />
                  </button>
                </div>
                <p className="text-center text-sm font-bold text-slate-300">{getHeroDef(displaySpeakerId).role}</p>
              </motion.div>
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
      <div className={inHeader ? 'h-full w-full' : undefined}>
      <AnimatePresence mode="wait">
        <motion.div
          key={statusMsgKey}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className={inHeader ? 'h-full w-full' : 'w-full'}
        >
          <motion.div
            className={
              inHeader
                ? `${GAME_HEADER_MESSAGE_CARD_CLASS} ${statusBarFrameClass}`
                : `rounded-xl border px-4 py-2 shadow-md ${statusBarFrameClass}`
            }
          >
            <div
              className={`flex min-h-0 min-w-0 flex-1 ${inHeader ? 'flex-row items-center gap-2 sm:gap-2.5' : ''} ${!inHeader && displaySpeakerId ? 'items-center gap-2.5 pb-2 sm:gap-3' : ''} ${!inHeader && !displaySpeakerId ? 'justify-center' : ''}`}
            >
              {displaySpeakerId ? (
                <button
                  ref={avatarSkillBtnRef}
                  type="button"
                  title="查看大頭像與被動／作戰說明"
                  className={`relative shrink-0 cursor-pointer rounded-2xl outline-none ring-offset-2 ring-offset-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500/80 ${inHeader ? '' : 'self-center'}`}
                  aria-expanded={skillBriefOpen}
                  aria-haspopup="dialog"
                  aria-label={`查看${speakerName}大頭像與被動／作戰說明`}
                  onClick={() => setSkillBriefOpen((v) => !v)}
                >
                  <HeroAvatarSilhouette heroId={displaySpeakerId} size={inHeader ? 104 : 48} />
                  <span
                    className={`pointer-events-none absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border border-amber-500/40 bg-slate-950/95 text-amber-400 shadow-md ring-1 ring-black/40 ${
                      inHeader ? 'h-7 w-7' : 'h-[18px] w-[18px]'
                    }`}
                    aria-hidden
                  >
                    <span className={`font-black leading-none ${inHeader ? 'text-xs' : 'text-[11px]'}`}>+</span>
                  </span>
                </button>
              ) : null}
              <div
                className={`min-w-0 flex-1 ${inHeader ? 'flex items-center' : 'overflow-x-auto [-webkit-overflow-scrolling:touch]'}`}
              >
                <p
                  className={`font-bold ${inHeader ? 'min-h-[2.35em] text-sm leading-snug sm:min-h-[2.5em] sm:text-base' : 'whitespace-nowrap text-base leading-snug sm:text-lg'} ${displaySpeakerId ? 'text-left' : 'text-center'} ${messageColorClass(gameState.status)}`}
                >
                  <TeletypeInline
                    full={statusMessage}
                    resetKey={statusMsgKey}
                    caretClassName={messageCaretClass(gameState.status)}
                  />
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
        </AnimatePresence>
      </div>
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
                      已完成 {levelCount} 關 · 火力{' '}
                      <span className="font-bold text-emerald-400">{destructivePowerPercentage.toFixed(1)}%</span>
                      {' '}
                      <span className="text-slate-500">（版面覆蓋 {fillPercentage.toFixed(1)}%）</span>
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
