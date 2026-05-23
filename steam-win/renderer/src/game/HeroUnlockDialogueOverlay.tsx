import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Radio } from 'lucide-react';
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

const AVATAR_SIZE = 56;

function SpeakColumn({
  heroId,
  name,
  codename,
  align,
  speaking,
  activeRingClass,
  children,
  onPortrait,
}: {
  heroId: string;
  name: string;
  codename?: string;
  align: 'left' | 'right';
  speaking: boolean;
  activeRingClass: string;
  children: ReactNode;
  onPortrait: () => void;
}) {
  const reverse = align === 'right';
  return (
    <motion.div
      layout
      className={`flex min-w-0 flex-1 gap-2.5 ${reverse ? 'flex-row-reverse' : ''} ${speaking ? '' : 'opacity-[0.38]'}`}
      animate={{ opacity: speaking ? 1 : 0.38 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        title={`放大 ${name} 頭像`}
        aria-label={`放大 ${name} 頭像`}
        onClick={onPortrait}
        className={`shrink-0 self-start rounded-lg outline-none ring-offset-2 ring-offset-slate-950 focus-visible:ring-2 ${
          speaking ? activeRingClass : 'ring-transparent'
        }`}
      >
        <HeroAvatarSilhouette heroId={heroId} size={AVATAR_SIZE} />
      </button>
      <motion.div
        layout
        className={`min-w-0 flex-1 ${reverse ? 'text-right' : 'text-left'}`}
      >
        {speaking ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className={`rounded-xl border px-3 py-2.5 shadow-md ${
              align === 'left'
                ? 'border-cyan-500/40 bg-cyan-950/40 shadow-cyan-950/20'
                : 'border-amber-500/35 bg-amber-950/35 shadow-amber-950/15'
            }`}
          >
            <p
              className={`mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${
                align === 'left' ? 'text-cyan-400/85' : 'text-amber-400/85'
              }`}
            >
              {name}
              {codename ? ` · ${codename}` : ''}
            </p>
            <p className="text-sm leading-relaxed text-slate-100">{children}</p>
          </motion.div>
        ) : (
          <p className={`pt-1 font-mono text-[10px] font-bold tracking-wide text-slate-600 ${reverse ? 'pr-0.5' : 'pl-0.5'}`}>
            {name}
          </p>
        )}
      </motion.div>
    </motion.div>
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
  const lineCount = lines.length;

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
    <>
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-cyan-500/15 pb-2.5">
        <motion.div layout className="flex min-w-0 items-center gap-2">
          <Radio className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden />
          <motion.div layout className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400/80">
              COMMS · 幹員接線
            </p>
            <h2 className="truncate text-sm font-black text-white sm:text-base">{hero.name} 已納入編制</h2>
          </motion.div>
        </motion.div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums text-slate-500">
            {lineIndex + 1}/{lineCount}
          </span>
          <button
            type="button"
            onClick={advance}
            disabled={!lineTypingDone}
            className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/35 bg-cyan-600/90 px-3 py-1.5 text-xs font-black text-slate-950 transition-colors hover:bg-cyan-500/90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isLastLine ? '結束' : '繼續'}
            <ChevronRight size={14} strokeWidth={2.75} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 sm:gap-4">
        <SpeakColumn
          heroId={heroId}
          name={hero.name}
          codename={hero.codename}
          align="left"
          speaking={heroSpeaking}
          activeRingClass="ring-2 ring-cyan-400/55"
          onPortrait={() => openPortrait(heroId)}
        >
          {heroSpeaking ? (
            <DialogueTeletypeLine
              text={currentLine.text}
              resetKey={lineResetKey}
              caretClassName="bg-cyan-300/80"
              onTypingDone={setLineTypingDone}
            />
          ) : null}
        </SpeakColumn>

        <motion.div
          layout
          className="mt-6 hidden w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-slate-600/35 to-transparent sm:block"
          aria-hidden
        />

        <SpeakColumn
          heroId={HERO_UNLOCK_PLAYER_HERO_ID}
          name={player.name}
          codename={player.codename ?? '新兵'}
          align="right"
          speaking={playerSpeaking}
          activeRingClass="ring-2 ring-amber-400/55"
          onPortrait={() => openPortrait(HERO_UNLOCK_PLAYER_HERO_ID)}
        >
          {playerSpeaking ? (
            <DialogueTeletypeLine
              text={currentLine.text}
              resetKey={lineResetKey}
              caretClassName="bg-amber-300/80"
              onTypingDone={setLineTypingDone}
            />
          ) : null}
        </SpeakColumn>
      </div>
    </>
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
          className="pointer-events-none fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-[1px] sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="幹員解鎖通話"
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="pointer-events-auto relative w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#0a0f16]/96 px-3.5 py-3 shadow-[0_12px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(34,211,238,0.06)] sm:px-4 sm:py-3.5"
          >
            <motion.div
              layout
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden>
              <motion.div
                layout
                className="h-full w-full"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(148,163,184,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)',
                  backgroundSize: '10px 10px',
                }}
              />
            </div>
            <motion.div className="relative">
              <HeroUnlockDialogueScene
                key={currentHeroId}
                heroId={currentHeroId}
                onSceneComplete={onSceneComplete}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
