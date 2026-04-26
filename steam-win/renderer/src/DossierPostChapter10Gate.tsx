import { AnimatePresence, motion } from 'motion/react';
import { Fingerprint } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DossierPostChapter10Block } from './levelData/dossierPostChapter10Content';
import { getDossierPostChapter10Content } from './levelData/dossierPostChapter10Content';
import { getHeroDef } from './heroes';
import { HeroAvatarSilhouette } from './home/HeroAvatarSilhouette';
import { useHeroPortraitLightbox } from './home/HeroPortraitLightbox';
import { SequentialTypedLines } from './teletype';

const HAZARD_SECTION_HEADING = '聯參戰情室通傳';
const HAZARD_SPEAKER_HERO_ID = 'ada' as const;
const COMMANDER_AVATAR_HERO_ID = 'commander' as const;
const COMMANDER_SECTION_HEADING = '指揮官勉勵';

type GatePhase = 'commander' | 'hazard';

type Props = {
  completedChapter: number;
  onConfirm: () => void;
  /** 測試或上層覆寫內文時使用 */
  contentOverride?: DossierPostChapter10Block;
};

function ArchiveStamp({ completedChapter }: { completedChapter: number }) {
  return (
    <div
      className="ops-stamp-wobble float-right clear-right ml-3 w-[9.5rem] rounded-sm border-4 border-red-600/70 sm:absolute sm:top-4 sm:right-4 sm:ml-0 sm:float-none"
      aria-hidden
    >
      <div className="bg-red-950/20 px-2.5 py-1.5 text-center">
        <p className="text-[0.6rem] font-black uppercase tracking-[0.35em] text-red-500/95 [text-shadow:0_0_1px_rgba(0,0,0,0.4)]">CONFIRMED</p>
        <p className="mt-0.5 text-[0.5rem] font-bold uppercase tracking-[0.12em] text-red-300/80">[ ARCHIVED ]</p>
        <p className="mt-1.5 text-[0.6rem] font-bold leading-tight text-red-200/90">
          第 {completedChapter} 章 · 第 10 關
        </p>
        <p className="text-[0.5rem] font-bold text-red-400/80">戰果已寫入指揮鏈</p>
      </div>
    </div>
  );
}

function FingerprintScanModule() {
  return (
    <div className="relative h-[3.25rem] w-[3.25rem] shrink-0 overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-950/90 shadow-[inset_0_0_20px_rgba(6,182,212,0.12)] dossier-fp-grid">
      <Fingerprint
        className="relative z-[1] mx-auto mt-2.5 h-7 w-7 text-cyan-200/80"
        strokeWidth={1.5}
        aria-hidden
      />
      <div className="dossier-fp-scan" />
    </div>
  );
}

export default function DossierPostChapter10Gate({ completedChapter, onConfirm, contentOverride }: Props) {
  const { openPortrait } = useHeroPortraitLightbox();
  const c = contentOverride ?? getDossierPostChapter10Content(completedChapter);
  const showPen = c.penSketches.length > 0;
  const hazardSpeaker = getHeroDef(HAZARD_SPEAKER_HERO_ID);
  const dossierReset = useMemo(
    () =>
      `dossier-${completedChapter}-${Boolean(contentOverride)}-${c.title}\u0001${c.encouragement.join('\u0001')}\u0001${c.nextHazard.join('\u0001')}\u0001${c.penSketches.join('\u0001')}`,
    [completedChapter, contentOverride, c.title, c.encouragement, c.nextHazard, c.penSketches],
  );

  const [phase, setPhase] = useState<GatePhase>('commander');
  const [encDone, setEncDone] = useState(false);
  const [hazardDone, setHazardDone] = useState(false);

  useEffect(() => {
    setPhase('commander');
    setEncDone(c.encouragement.length === 0);
    setHazardDone(c.nextHazard.length === 0);
  }, [dossierReset, c.encouragement.length, c.nextHazard.length]);

  const onEncDone = useCallback(() => setEncDone(true), []);
  const onHazardDone = useCallback(() => setHazardDone(true), []);
  const showPenBlock = showPen;

  return (
    <div className="relative min-h-screen min-w-[360px] overflow-hidden bg-slate-950 font-sans text-slate-200">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 20%, rgba(8, 51, 68, 0.55) 0%, rgba(2, 6, 12, 0.97) 55%, #02030a 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.04)_3px,rgba(0,0,0,0.04)_4px)]"
        style={{ mixBlendMode: 'multiply' }}
      />

      <AnimatePresence>
        <motion.div
          key="dossier-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative flex min-h-screen items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 12, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 6, opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="dossier-tablet-aura relative max-h-[min(82vh,38rem)] w-full max-w-lg overflow-y-auto rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dossier-gate-title"
            aria-describedby="dossier-gate-kicker"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-950/25 via-slate-950/75 to-slate-950/95"
              style={{ zIndex: 0 }}
            />
            <div className="scanlines pointer-events-none absolute inset-0 opacity-70" style={{ zIndex: 1 }} />
            <div className="dossier-film-grain pointer-events-none absolute inset-0 opacity-[0.14]" style={{ zIndex: 2 }} />

            <div className="relative z-10 p-5 sm:p-6" style={{ zIndex: 3 }}>
              {phase === 'commander' ? (
                <>
                  <div className="relative pr-0 sm:min-h-[4.5rem] sm:pr-36">
                    <ArchiveStamp completedChapter={completedChapter} />
                    <div className="flex items-start gap-3">
                      <FingerprintScanModule />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p
                          id="dossier-gate-kicker"
                          className="text-[0.6rem] font-bold uppercase tracking-[0.28em] text-cyan-500/80"
                        >
                          戰術平板 · 授權讀取
                        </p>
                        <h2
                          id="dossier-gate-title"
                          className="mt-1.5 text-lg font-black leading-snug text-white [text-shadow:0_0_20px_rgba(34,211,238,0.15)] sm:text-xl"
                        >
                          {c.title}
                        </h2>
                        <p className="mt-1 text-[0.6rem] font-mono text-slate-500/90">SECURE LINK · 回到行動卷宗前最後一則筆記</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-1 mt-5 h-px bg-gradient-to-r from-transparent via-slate-600/60 to-transparent" />

                  <div className="mb-5 space-y-5 text-[0.9rem] leading-relaxed">
                    <section aria-label="指揮官勉勵台詞">
                      <div className="mb-2.5 flex items-center gap-2.5 sm:gap-3">
                        <button
                          type="button"
                          title="放大指揮官頭像"
                          aria-label="放大指揮官頭像"
                          onClick={() => openPortrait(COMMANDER_AVATAR_HERO_ID)}
                          className="shrink-0 cursor-zoom-in rounded-lg outline-none ring-emerald-500/40 ring-offset-2 ring-offset-slate-950 focus-visible:ring-2"
                        >
                          <HeroAvatarSilhouette heroId={COMMANDER_AVATAR_HERO_ID} size={40} />
                        </button>
                        <div className="min-w-0">
                          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-emerald-500/90">{COMMANDER_SECTION_HEADING}</p>
                        </div>
                      </div>
                      <div className={`flex flex-col gap-3 ${showPen ? 'md:flex-row md:items-start' : ''}`}>
                        <SequentialTypedLines
                          as="ul"
                          itemAs="li"
                          lines={c.encouragement}
                          resetKey={`${dossierReset}-enc`}
                          className={`min-w-0 list-none text-left text-sm font-semibold text-slate-200/95 ${
                            showPen ? 'flex-1 md:min-w-0' : 'w-full'
                          }`}
                          itemClassName="border-l-2 border-emerald-500/45 pl-3 leading-relaxed [text-shadow:0_1px_0_rgba(0,0,0,0.3)] not-last:mb-2.5"
                          pace="slow"
                          onAllLinesDone={onEncDone}
                        />
                        {showPenBlock ? (
                          <div className="relative w-full max-w-full shrink-0 border border-dashed border-sky-600/35 bg-slate-900/50 px-3 py-2.5 md:max-w-[12rem] md:rotate-[-0.2deg]">
                            <p className="text-[0.5rem] font-mono text-sky-600/70">CMD BLUE PEN</p>
                            {c.penSketches.map((s, j) => (
                              <p
                                key={`pen-${dossierReset}-${j}`}
                                className="dossier-pen-sketch pt-1 text-[0.8rem] font-medium italic leading-relaxed text-sky-200/90"
                              >
                                {s}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </section>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPhase('hazard')}
                    disabled={!encDone}
                    className="dossier-signal-btn w-full rounded-xl border border-cyan-400/25 bg-gradient-to-b from-cyan-600/95 to-cyan-800/90 py-3.5 text-sm font-black text-slate-950 [text-shadow:0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:from-cyan-500/95 hover:to-cyan-700/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    確定
                  </button>
                </>
              ) : (
                <section
                  aria-label={`${HAZARD_SECTION_HEADING}，${hazardSpeaker.name}台詞`}
                  className="dossier-hazard-brief relative overflow-hidden rounded-2xl border border-red-500/35 bg-gradient-to-b from-[#22050b]/95 via-[#0f0509]/95 to-[#08050a]/95 p-4 sm:p-5"
                >
                  <div className="dossier-hazard-pulse absolute inset-0" aria-hidden />
                  <div className="relative z-[1]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.58rem] font-black uppercase tracking-[0.3em] text-red-400/90">Joint Ops Relay · Priority One</p>
                        <h2 className="mt-1 text-[1.05rem] font-black leading-tight text-red-100 sm:text-[1.15rem]">
                          {HAZARD_SECTION_HEADING}
                        </h2>
                        <p className="mt-1 text-[0.6rem] font-mono text-red-300/80">Transmission ID // CH-{completedChapter}-STAGE10</p>
                      </div>
                      <button
                        type="button"
                        title={`放大 ${hazardSpeaker.name} 頭像`}
                        aria-label={`放大 ${hazardSpeaker.name} 頭像`}
                        onClick={() => openPortrait(HAZARD_SPEAKER_HERO_ID)}
                        className="shrink-0 cursor-zoom-in rounded-lg outline-none ring-red-500/45 ring-offset-2 ring-offset-slate-950 focus-visible:ring-2"
                      >
                        <HeroAvatarSilhouette heroId={HAZARD_SPEAKER_HERO_ID} size={42} />
                      </button>
                    </div>

                    <div className="mt-4 border-y border-red-500/25 py-2">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-red-300/90">{hazardSpeaker.name}</p>
                      <p className="text-[0.58rem] font-medium text-red-200/75">
                        {hazardSpeaker.codename ? `代號 ${hazardSpeaker.codename}` : '戰況轉發官'}
                      </p>
                    </div>

                    <SequentialTypedLines
                      as="ul"
                      itemAs="li"
                      lines={c.nextHazard}
                      resetKey={`${dossierReset}-haz`}
                      className="mt-4 list-none text-left text-sm font-semibold text-red-100/95"
                      itemClassName="border-l-2 border-red-400/60 pl-3 leading-relaxed [text-shadow:0_1px_0_rgba(0,0,0,0.45)] not-last:mb-2.5"
                      pace="slow"
                      activeCaretClassName="bg-red-300/85"
                      onAllLinesDone={onHazardDone}
                    />

                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={!hazardDone}
                      className="dossier-hazard-btn mt-5 w-full rounded-xl border border-red-400/30 bg-gradient-to-b from-red-500/90 to-red-700/90 py-3.5 text-sm font-black text-red-50 transition-colors hover:from-red-400/95 hover:to-red-600/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      確定
                    </button>
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
