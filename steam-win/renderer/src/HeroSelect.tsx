import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Shield } from 'lucide-react';
import { HEROES, getStoredHeroId, setStoredHeroId } from './heroes';
import { TerminalBackdrop } from './ui/TerminalBackdrop';

export default function HeroSelect({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(getStoredHeroId);

  return (
    <TerminalBackdrop className="font-mono text-slate-200 selection:bg-[#F59E0B]/30">
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border-2 border-[#1e293b] bg-[#0f141c] px-3 py-2 text-sm font-bold text-slate-200 hover:border-[#F59E0B]/50 hover:text-[#F59E0B]"
          >
            <ChevronLeft size={18} />
            返回首頁
          </button>
          <h1 className="text-xl font-black text-white md:text-2xl">角色整備 · Hero Gallery</h1>
        </motion.header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HEROES.map((h, i) => {
            const active = h.id === selected;
            return (
              <motion.button
                key={h.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => {
                  setSelected(h.id);
                  setStoredHeroId(h.id);
                }}
                className={`rounded-3xl border-2 p-5 text-left transition-all ${
                  active
                    ? 'border-[#F59E0B] bg-[#1a1408] shadow-[0_0_28px_rgba(245,158,11,0.18)]'
                    : 'border-[#1e293b] bg-[#0f141c]/95 hover:border-slate-600'
                }`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F59E0B]/30 bg-[#0B0E14]">
                    <Shield className="text-slate-500" size={26} strokeWidth={1.2} />
                  </div>
                  <div>
                    <div className="text-lg font-black text-white">{h.name}</div>
                    <div className="text-xs font-bold text-[#F59E0B]/90">{h.role}</div>
                  </div>
                </div>
                {h.skillName ? (
                  <div className="text-sm text-slate-400">
                    <span className="font-bold text-emerald-400">{h.skillName}</span>
                    {h.skillDetail ? ` · ${h.skillDetail}` : ''}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">技能：無（教學與基礎關卡向）</div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </TerminalBackdrop>
  );
}
