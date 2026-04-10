import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, ShieldAlert, X } from 'lucide-react';
import type { Level } from '../gameLogic';
import { buildLevelStrategyGuideModel } from './levelStrategyGuideModel';

type Tab = 'logic' | 'flow' | 'briefing';

export function LevelStrategyGuideTrigger({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title="戰略指南（本關）"
      className={`inline-flex items-center gap-1 rounded-lg border border-slate-700/90 bg-slate-900/80 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-amber-500/95 shadow-sm transition-colors hover:border-amber-500/45 hover:bg-slate-800 hover:text-amber-400 ${className}`}
      {...props}
    >
      <BookOpen size={13} className="shrink-0 opacity-90" aria-hidden />
      指南
    </button>
  );
}

export function LevelStrategyGuide({
  level,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: {
  level: Level;
  /** 與 onOpenChange 併用時為受控模式（例如按鈕放在 GameHeader 第一行） */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** false：不渲染內建按鈕，改以 LevelStrategyGuideTrigger 自行擺放 */
  showTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = onOpenChange != null;
  const open = controlled ? Boolean(openProp) : internalOpen;
  const setOpen = (next: boolean) => {
    if (controlled) onOpenChange(next);
    else setInternalOpen(next);
  };

  const [tab, setTab] = useState<Tab>('briefing');
  const m = buildLevelStrategyGuideModel(level);

  useEffect(() => {
    setTab('briefing');
  }, [level.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {showTrigger && (
        <div className="mb-2 flex w-full max-w-6xl shrink-0 justify-end">
          <LevelStrategyGuideTrigger onClick={() => setOpen(true)} />
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-strategy-guide-title"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="max-h-[min(88vh,720px)] w-full max-w-lg overflow-hidden rounded-2xl border-2 border-[#1e293b] bg-[#0f141c] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#1e293b] px-4 py-3 sm:px-5">
                <h2 id="level-strategy-guide-title" className="text-base font-black text-white sm:text-lg">
                  戰略指南
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-[#1a2332] hover:text-white"
                  aria-label="關閉"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1 border-b border-[#1e293b] px-3 pt-2 sm:px-5 sm:pt-3">
                <TabBtn active={tab === 'briefing'} onClick={() => setTab('briefing')}>
                  本關設定
                </TabBtn>
                <TabBtn active={tab === 'logic'} onClick={() => setTab('logic')}>
                  核心邏輯
                </TabBtn>
                <TabBtn active={tab === 'flow'} onClick={() => setTab('flow')}>
                  操作流程
                </TabBtn>
              </div>
              <div className="max-h-[min(58vh,480px)] overflow-y-auto p-4 text-sm leading-relaxed text-slate-400 sm:p-5">
                {tab === 'briefing' && (
                  <div className="space-y-3">
                    <p className="flex items-start gap-2 font-bold text-white">
                      <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
                      {level.name}
                    </p>
                    <ul className="list-inside list-disc space-y-2 marker:text-amber-600">
                      <li>{m.chapterLine}</li>
                      <li>{m.mapLine}</li>
                      <li>{m.boundaryLine}</li>
                      <li>
                        過關覆蓋率：<span className="font-bold text-emerald-400">{m.coveragePercent}%</span> 的可部署格須成功埋雷。
                      </li>
                      <li>{m.timeLine}</li>
                      <li>{m.handLine}</li>
                      <li>{m.digitsLine}</li>
                      <li>{m.hintsLine}</li>
                      {m.forbiddenLine && <li>{m.forbiddenLine}</li>}
                      {m.cloudLine && <li>{m.cloudLine}</li>}
                      {m.dynamicMineLine && <li className="text-cyan-400">{m.dynamicMineLine}</li>}
                    </ul>
                    <div className="border-t border-slate-800 pt-3">
                      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">戰場事件</p>
                      <ul className="space-y-1.5">
                        {m.eventsLines.map((line, i) => (
                          <li key={i} className="pl-2 text-slate-400">
                            · {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {tab === 'logic' && (
                  <div className="space-y-4">
                    <p>
                      <span className="font-bold text-emerald-400">身份：</span>
                      你是接長官電報的作戰幹員（新兵、工程師等），依電碼在雷區「佈雷」——不是排雷。
                    </p>
                    <p>
                      <span className="font-bold text-emerald-400">邏輯：</span>
                      {m.logicNeighborLine}
                    </p>
                    <p>
                      <span className="font-bold text-red-400">連鎖反應：</span>
                      一旦佈署導致邏輯矛盾，全線地雷將立即連鎖爆炸，任務失敗。
                    </p>
                  </div>
                )}
                {tab === 'flow' && (
                  <ul className="list-inside list-decimal space-y-3 marker:text-[#F59E0B]">
                    <li>
                      <span className="font-bold text-white">選取電碼：</span>
                      從「長官電報」列選一道電碼（本關最多同時 {level.definition.commands.maxHand} 道待辦）。
                    </li>
                    <li>
                      <span className="font-bold text-white">執行佈雷：</span>
                      點擊可部署空格，你方人員前往該格，依電碼埋下相同數值的約束。
                    </li>
                    <li>
                      <span className="font-bold text-white">達成目標：</span>
                      滿足盤面上所有數字約束，並使覆蓋率達到{' '}
                      <span className="text-emerald-400">{m.coveragePercent}%</span> 即可過關。
                    </li>
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-lg px-3 py-2 text-xs font-bold sm:text-sm ${
        active ? 'bg-[#1a2332] text-[#F59E0B]' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
