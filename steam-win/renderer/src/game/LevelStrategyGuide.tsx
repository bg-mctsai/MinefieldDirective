import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, X } from 'lucide-react';
import type { Level } from '../gameLogic';
import { getStoredHeroId, telegraphHandSlotCount } from '../heroes';
import { buildLevelStrategyGuideModel } from './levelStrategyGuideModel';
import { resolveMedalThresholds } from './medalThresholds';

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
  const combatHeroId = getStoredHeroId();
  const telegraphSlots = telegraphHandSlotCount(combatHeroId);
  const m = useMemo(
    () =>
      buildLevelStrategyGuideModel(level, {
        heroId: combatHeroId,
      }),
    [level.id, combatHeroId],
  );
  const medalT = useMemo(() => resolveMedalThresholds(level.definition), [level.id, level.definition]);
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
                  本關機制
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
                    <ul className="list-inside list-disc space-y-2 marker:text-amber-600">
                      {m.briefingSummaryLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                    <div className="border-t border-slate-800 pt-3">
                      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">戰場事件</p>
                      <p className="text-slate-400">{m.eventsLines[0] ?? '無'}</p>
                    </div>
                  </div>
                )}
                {tab === 'logic' && (
                  <div className="space-y-4">
                    <p>
                      <span className="font-bold text-emerald-400">身份：</span>
                      你是接長官電報的前沿作戰幹員；依電碼在指定雷區執行「連鎖佈雷」。本作戰為主動埋設連鎖雷網，與傳統掃雷／排雷相反。
                    </p>
                    <p>
                      <span className="font-bold text-emerald-400">指令節奏：</span>
                      長官電報列同時列出 {telegraphSlots} 道待辦電碼；每回合須從中完成 2 道後，才會刷新下一批佇列。
                    </p>
                    <p>
                      <span className="font-bold text-emerald-400">數字約束：</span>
                      {m.logicNeighborLine}
                      多一枚、少一枚皆視為佈線錯誤。
                    </p>
                    <p>
                      <span className="font-bold text-red-400">連鎖雷與引爆：</span>
                      你佈下的是可連鎖觸發的雷具；全盤必須自洽吻合所有數字約束。若佈署造成邏輯矛盾，將觸發全線連鎖引爆，任務當場失敗。
                    </p>
                    <p>
                      <span className="font-bold text-emerald-400">火力與勳章：</span>
                      「火力」＝(基本地雷+重疊地雷)／總格數，火力達到本關門檻 {Math.round(medalT.bronze * 100)}%(銅)／{Math.round(medalT.silver * 100)}%(銀)／{Math.round(medalT.gold * 100)}%(金)，獲得勳章。
                    </p>
                    {level.definition.neighborPlacedDigitBonus && (
                      <p>
                        <span className="font-bold text-orange-400">鄰格加成（JSON 旗標）：</span>
                        本關啟用 levels.json 的 <span className="font-mono text-slate-300">neighborPlacedDigitBonus</span>
                        ；盤面上的數字是「加成後」的約束，與電報底數可能不同。
                      </p>
                    )}
                  </div>
                )}
                {tab === 'flow' && (
                  <ul className="list-inside list-decimal space-y-3 marker:text-[#F59E0B]">
                    <li>
                      <span className="font-bold text-white">排定電碼：</span>
                      依戰況在電報列點選要先執行的電碼（節奏見「核心邏輯」）。
                    </li>
                    <li>
                      <span className="font-bold text-white">執行佈雷：</span>
                      {level.definition.neighborPlacedDigitBonus ? (
                        <>
                          點選可部署空格；幹員前進至該格埋雷。盤面顯示之約束數字＝電碼底數＋該格邏輯相鄰「既有數字格」枚數（本關啟用 levels.json{' '}
                          <span className="font-mono text-slate-300">neighborPlacedDigitBonus</span>）。
                        </>
                      ) : (
                        <>點選可部署空格；幹員前進至該格，依電碼埋下相同數值之鄰域約束。</>
                      )}
                    </li>
                    <li>
                      <span className="font-bold text-white">達成目標：</span>
                      全盤數字約束皆成立，且覆蓋率達任務門檻，即判定過關。
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
      className={`rounded-t-lg px-3 py-2 text-xs font-bold sm:text-sm ${active ? 'bg-[#1a2332] text-[#F59E0B]' : 'text-slate-500 hover:text-slate-300'
        }`}
    >
      {children}
    </button>
  );
}
