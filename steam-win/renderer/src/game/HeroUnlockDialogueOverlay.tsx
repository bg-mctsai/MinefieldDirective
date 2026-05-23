import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getHeroDef } from '../heroes';
import { HeroAvatarSilhouette } from '../home/HeroAvatarSilhouette';
import { useHeroPortraitLightbox } from '../home/HeroPortraitLightbox';
import {
  HERO_UNLOCK_PLAYER_HERO_ID,
  getHeroUnlockDialogue,
  type HeroUnlockDialogueLine,
} from '../levelData/heroUnlockDialogue';
import { TeletypeCaret } from '../teletype/TeletypeCaret';
import { useTeletypeReveal } from '../teletype/useTeletypeReveal';

const AVATAR_SIZE = 88;

function DialogueBubble({
  active,
  dimmed,
  align,
  name,
  codename,
  children,
}: {
  active: boolean;
  dimmed: boolean;
  align: 'left' | 'right';
  name: string;
  codename?: string;
  children: ReactNode;
}) {
  const alignClass = align === 'left' ? 'items-start text-left' : 'items-end text-right';
  const bubbleAlign = align === 'left' ? 'rounded-tl-sm' : 'rounded-tr-sm';
  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-2 ${alignClass} ${dimmed ? 'opacity-45' : ''}`}>
      <div className={`min-w-0 ${align === 'right' ? 'self-end' : 'self-start'}`}>
        <p className={`text-base font-black ${active ? 'text-white' : 'text-slate-400'}`}>{name}</p>
        {codename ? (
          <p className="font-mono text-xs text-slate-500">{codename}</p>
        ) : null}
      </div>
      <div
        className={`w-full min-h-[4.5rem] rounded-2xl border px-4 py-3.5 shadow-lg transition-colors sm:min-h-[5.25rem] sm:px-5 sm:py-4 ${bubbleAlign} ${
          active
            ? align === 'left'
              ? 'border-cyan-500/45 bg-cyan-950/35 text-slate-100 shadow-cyan-950/30'
              : 'border-amber-500/45 bg-amber-950/30 text-slate-100 shadow-amber-950/25'
            : 'border-slate-700/60 bg-slate-900/50 text-slate-400'
        }`}
      >
        <p className="text-base leading-relaxed sm:text-lg">{children}</p>
      </div>
    </div>
  );
}

function HeroUnlockDialogueScene({
  heroId,
  onSceneComplete,
}: {
  heroId: string;
  onSceneComplete: () => void;
}) {
  const { openPortrait } = useHeroPortraitLightbox();
  const hero = getHeroDef(heroId);
  const player = getHeroDef(HERO_UNLOCK_PLAYER_HERO_ID);
  const dialogue = useMemo(() => getHeroUnlockDialogue(heroId), [heroId]);
  const lines = dialogue?.lines ?? [];

  const [lineIndex, setLineIndex] = useState(0);
  const [lineTypingDone, setLineTypingDone] = useState(false);

  const currentLine: HeroUnlockDialogueLine | null = lines[lineIndex] ?? null;
  const isLastLine = lineIndex >= lines.length - 1;

  useEffect(() => {
    setLineIndex(0);
    setLineTypingDone(lines.length === 0);
  }, [heroId, lines.length]);

  useEffect(() => {
    setLineTypingDone(false);
  }, [lineIndex, heroId]);

  const advance = useCallback(() => {
    if (!lineTypingDone) return;
    if (isLastLine) {
      onSceneComplete();
      return;
    }
    setLineIndex((i) => i + 1);
  }, [isLastLine, lineTypingDone, onSceneComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  useEffect(() => {
    if (lines.length === 0) onSceneComplete();
  }, [lines.length, onSceneComplete]);

  if (!currentLine) return null;

  const heroSpeaking = currentLine.side === 'hero';
  const playerSpeaking = currentLine.side === 'player';
  const lineResetKey = `${heroId}-${lineIndex}-${currentLine.text}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 flex shrink-0 items-center gap-2 border-b border-cyan-500/20 pb-3">
        <UserPlus className="h-5 w-5 text-cyan-300" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-300/90">COMMS LINK · 幹員接線</p>
          <h2 className="text-xl font-black text-white sm:text-2xl">{hero.name} 已納入編制</h2>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <div className="flex min-h-0 flex-col gap-3">
          <button
            type="button"
            title={`放大 ${hero.name} 頭像`}
            aria-label={`放大 ${hero.name} 頭像`}
            onClick={() => openPortrait(heroId)}
            className={`self-start rounded-xl outline-none ring-cyan-500/40 ring-offset-2 ring-offset-slate-950 focus-visible:ring-2 ${
              heroSpeaking ? 'ring-2 ring-cyan-400/50' : ''
            }`}
          >
            <HeroAvatarSilhouette heroId={heroId} size={AVATAR_SIZE} />
          </button>
          <DialogueBubble
            active={heroSpeaking}
            dimmed={playerSpeaking}
            align="left"
            name={hero.name}
            codename={hero.codename ? `代號 ${hero.codename}` : undefined}
          >
            {heroSpeaking ? (
              <DialogueTeletypeLine
                text={currentLine.text}
                resetKey={lineResetKey}
                caretClassName="bg-cyan-300/80"
                onTypingDone={setLineTypingDone}
              />
            ) : (
              <span className="text-slate-600">……</span>
            )}
          </DialogueBubble>
        </div>

        <div className="flex min-h-0 flex-col gap-3 sm:items-end">
          <button
            type="button"
            title={`放大 ${player.name} 頭像`}
            aria-label={`放大 ${player.name} 頭像`}
            onClick={() => openPortrait(HERO_UNLOCK_PLAYER_HERO_ID)}
            className={`self-start rounded-xl outline-none ring-amber-500/40 ring-offset-2 ring-offset-slate-950 focus-visible:ring-2 sm:self-end ${
              playerSpeaking ? 'ring-2 ring-amber-400/50' : ''
            }`}
          >
            <HeroAvatarSilhouette heroId={HERO_UNLOCK_PLAYER_HERO_ID} size={AVATAR_SIZE} />
          </button>
          <DialogueBubble
            active={playerSpeaking}
            dimmed={heroSpeaking}
            align="right"
            name={player.name}
            codename={player.codename ? `代號 ${player.codename}` : '新兵'}
          >
            {playerSpeaking ? (
              <DialogueTeletypeLine
                text={currentLine.text}
                resetKey={lineResetKey}
                caretClassName="bg-amber-300/80"
                onTypingDone={setLineTypingDone}
              />
            ) : (
              <span className="text-slate-600">……</span>
            )}
          </DialogueBubble>
        </div>
      </div>

      <button
        type="button"
        onClick={advance}
        disabled={!lineTypingDone}
        className="mt-5 flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-gradient-to-b from-cyan-600/95 to-cyan-800/90 py-3.5 text-base font-black text-slate-950 transition-colors hover:from-cyan-500/95 hover:to-cyan-700/90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-lg"
      >
        {isLastLine ? '結束通話' : '繼續'}
        <ChevronRight size={18} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

function DialogueTeletypeLine({
  text,
  resetKey,
  caretClassName,
  onTypingDone,
}: {
  text: string;
  resetKey: string;
  caretClassName: string;
  onTypingDone: (done: boolean) => void;
}) {
  const { text: visible, done } = useTeletypeReveal(text, resetKey);

  useEffect(() => {
    onTypingDone(done);
  }, [done, onTypingDone]);

  return (
    <span className="inline text-left" aria-busy={!done}>
      <span aria-hidden="true">{visible}</span>
      {!done ? <TeletypeCaret className={caretClassName} /> : null}
    </span>
  );
}

export function HeroUnlockDialogueOverlay({
  visible,
  heroIds,
  onComplete,
}: {
  visible: boolean;
  heroIds: string[];
  onComplete: () => void;
}) {
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setHeroIndex(0);
  }, [visible, heroIds.join('\u0001')]);

  const currentHeroId = heroIds[heroIndex];
  const hasScene = currentHeroId != null;

  const onSceneComplete = useCallback(() => {
    if (heroIndex + 1 < heroIds.length) {
      setHeroIndex((i) => i + 1);
      return;
    }
    onComplete();
  }, [heroIndex, heroIds.length, onComplete]);

  return (
    <AnimatePresence>
      {visible && hasScene && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex flex-col justify-end bg-slate-950/72 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="幹員解鎖通話"
        >
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="hero-unlock-dialogue-panel flex max-h-[min(92dvh,52rem)] min-h-[min(50dvh,28rem)] w-full flex-col border-t-2 border-cyan-500/35 bg-gradient-to-b from-[#0c121c]/98 via-[#080d14]/98 to-[#05070c]/98 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-24px_80px_rgba(0,0,0,0.55)] sm:px-8 sm:pt-6"
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden>
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(148,163,184,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
              />
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col">
              <HeroUnlockDialogueScene
                key={currentHeroId}
                heroId={currentHeroId}
                onSceneComplete={onSceneComplete}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
