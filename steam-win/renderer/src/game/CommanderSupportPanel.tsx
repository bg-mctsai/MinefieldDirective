import { AnimatePresence, motion } from 'motion/react';
import { HeartHandshake, Radio, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { GAME_FIXED } from './gameFixedMessages';
import type { GameState } from './types';

type SupportMood = 'steady' | 'guide' | 'urgent' | 'hurt' | 'proud';

type SupportDialogue = {
  mood: SupportMood;
  label: string;
  text: string;
};

type SupportDialogueText = {
  label: string;
  text: string;
};

function supportDialogueFor(levelId: number, mood: SupportMood): SupportDialogue {
  const support = GAME_FIXED.commanderSupport as {
    default: Record<SupportMood, SupportDialogueText>;
    byLevelId?: Record<string, Partial<Record<SupportMood, SupportDialogueText>>>;
  };
  const resolved = support.byLevelId?.[String(levelId)]?.[mood] ?? support.default[mood];
  return { mood, ...resolved };
}

function bubbleClass(mood: SupportMood): string {
  if (mood === 'proud') return 'border-emerald-400/25 bg-emerald-500/5';
  if (mood === 'hurt') return 'border-rose-400/20 bg-rose-500/5';
  if (mood === 'urgent') return 'border-amber-400/25 bg-amber-500/5';
  if (mood === 'guide') return 'border-sky-400/25 bg-sky-500/5';
  return 'border-slate-600/50 bg-slate-800/45';
}

function portraitGlowClass(mood: SupportMood): string {
  if (mood === 'proud') return 'from-emerald-400/35';
  if (mood === 'hurt') return 'from-rose-400/28';
  if (mood === 'urgent') return 'from-amber-400/30';
  if (mood === 'guide') return 'from-sky-400/30';
  return 'from-slate-400/20';
}

function moodIcon(mood: SupportMood) {
  if (mood === 'proud') return <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" strokeWidth={2} />;
  if (mood === 'hurt') return <ShieldAlert className="h-3.5 w-3.5 text-rose-300" strokeWidth={2} />;
  if (mood === 'urgent') return <Radio className="h-3.5 w-3.5 text-amber-300" strokeWidth={2} />;
  return <HeartHandshake className="h-3.5 w-3.5 text-sky-300" strokeWidth={2} />;
}

export function CommanderSupportPanel({ gameState }: { gameState: GameState }) {
  const prevStatusRef = useRef<GameState['status']>(gameState.status);
  const hasShownOpeningRef = useRef(false);
  const hasShownLast10Ref = useRef(false);
  const [dialogue, setDialogue] = useState<SupportDialogue>(() =>
    supportDialogueFor(gameState.level.id, 'steady'),
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    prevStatusRef.current = gameState.status;
  }, [gameState.status]);

  useEffect(() => {
    hasShownOpeningRef.current = false;
    hasShownLast10Ref.current = false;
    setDialogue(supportDialogueFor(gameState.level.id, 'steady'));
    setVisible(true);
  }, [gameState.gameId]);

  useEffect(() => {
    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(id);
  }, [dialogue]);

  useEffect(() => {
    if (gameState.status === 'won') {
      setDialogue(supportDialogueFor(gameState.level.id, 'proud'));
      return;
    }

    if (gameState.status === 'playing') {
      if (gameState.timerStarted && !hasShownOpeningRef.current) {
        hasShownOpeningRef.current = true;
        setDialogue(supportDialogueFor(gameState.level.id, 'guide'));
        return;
      }
      if (
        gameState.timerStarted &&
        gameState.secondsLeft !== null &&
        gameState.secondsLeft <= 10 &&
        !hasShownLast10Ref.current
      ) {
        hasShownLast10Ref.current = true;
        setDialogue(supportDialogueFor(gameState.level.id, 'urgent'));
        return;
      }
      return;
    }

    if (
      (gameState.status === 'exploding' || gameState.status === 'lost') &&
      prevStatusRef.current === 'playing'
    ) {
      setDialogue(supportDialogueFor(gameState.level.id, 'hurt'));
    }
  }, [gameState.status, gameState.timerStarted, gameState.secondsLeft, gameState.gameId, gameState.level.id]);

  return (
    <aside className="w-full max-w-[21rem] shrink-0 lg:ml-auto lg:-mt-1 lg:pt-2">
      <div className="flex justify-end">
        <AnimatePresence mode="wait">
          {visible && (
            <motion.div
              key={`${gameState.gameId}-${dialogue.label}-${dialogue.text}-wrap`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex max-w-full items-end gap-2.5"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${gameState.gameId}-${dialogue.label}-${dialogue.text}`}
                  initial={{ opacity: 0, x: 12, y: 6 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: 8, y: -4 }}
                  transition={{ duration: 0.22 }}
                  className={`relative mb-8 min-w-0 max-w-[12.5rem] rounded-[1.25rem] rounded-br-md border px-3 py-2.5 shadow-xl ${bubbleClass(
                    dialogue.mood,
                  )}`}
                >
                  <p className="text-[15px] font-semibold leading-7 text-slate-100">「{dialogue.text}」</p>
                  <div className="absolute -right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-r border-t border-inherit bg-inherit" />
                </motion.div>
              </AnimatePresence>

              <div className="relative h-32 w-20 shrink-0 overflow-hidden rounded-t-[1.35rem] rounded-b-[0.8rem] bg-transparent opacity-85">
                <div
                  className={`absolute inset-x-2 top-2 h-12 rounded-full bg-gradient-to-b ${portraitGlowClass(
                    dialogue.mood,
                  )} to-transparent blur-md`}
                />
                <div className="absolute left-1/2 top-3 h-10 w-10 -translate-x-1/2 rounded-full bg-slate-200/86" />
                <div className="absolute bottom-0 left-1/2 h-20 w-16 -translate-x-1/2 rounded-t-[999px] bg-slate-400/75" />
                <div className="absolute bottom-9 left-1/2 h-14 w-24 -translate-x-1/2 rounded-t-[999px] bg-slate-500/22 blur-xl" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
