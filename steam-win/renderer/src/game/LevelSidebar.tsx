import { ChevronRight, LayoutGrid, Lock } from 'lucide-react';
import type { Level } from '../gameLogic';
import { campaignLevelHeaderTitle } from './campaignLevelUi';
import { isLevelUnlocked } from './gameProgressStorage';
import { LevelStrategyGuide } from './LevelStrategyGuide';

export function LevelSidebar({
  levels,
  currentLevelIndex,
  onSelectLevel,
  highestClearedLevel,
}: {
  levels: Level[];
  currentLevelIndex: number;
  onSelectLevel: (index: number) => void;
  highestClearedLevel: number;
}) {
  return (
    <div className="space-y-6 lg:col-span-3">
      <div className="rounded-[2rem] border-2 border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-white">
          <LayoutGrid size={18} className="text-amber-500" /> 選擇戰區
        </h2>
        <div className="space-y-2">
          {levels.map((level, idx) => (
            // Note: 鎖定關卡在 UI 直接不可點，避免繞過「必須逐關解鎖」規則
            <button
              key={level.id}
              type="button"
              disabled={!isLevelUnlocked(level.id, highestClearedLevel)}
              onClick={() => {
                if (!isLevelUnlocked(level.id, highestClearedLevel)) return;
                onSelectLevel(idx);
              }}
              className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all ${
                !isLevelUnlocked(level.id, highestClearedLevel)
                  ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed opacity-70'
                  : currentLevelIndex === idx
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                    : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2 font-bold">
                {campaignLevelHeaderTitle(level)}
                {!isLevelUnlocked(level.id, highestClearedLevel) && <Lock size={14} className="text-slate-500" />}
              </span>
              <ChevronRight
                size={16}
                className={`transition-transform ${
                  currentLevelIndex === idx ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <LevelStrategyGuide level={levels[currentLevelIndex]!} />
    </div>
  );
}
