import { useEffect, useMemo, useState } from 'react';
import { HEROES, resolveMissionBriefCarouselLines } from './heroes';
import { TeletypeInline } from './teletype';
import { HeroPortraitZoomButton } from './home/HeroPortraitZoomButton';

const COMMS_HERO_ID = 'ada';
const DEFAULT_ROTATE_MS = 3000;
/** 側欄直向堆疊時頭像邊長（px） */
const STACKED_AVATAR_PX = 128;
const FALLBACK_LINES = ['頻道待機。地圖就緒後接敵。'];

function mergeBriefLinesUnique(heroId: string, levelIds: readonly number[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const lid of levelIds) {
    for (const s of resolveMissionBriefCarouselLines(heroId, lid)) {
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

export type MissionLevelBriefHeroCommsProps = {
  /** 本章地圖上的關卡 id；合併各關艾達戰術句後去重輪播 */
  levelIds: readonly number[];
  /** 每句停留時間（毫秒），預設 3000 */
  rotateIntervalMs?: number;
  /**
   * `horizontal`：頭像左、文字右（44px）。
   * `stacked`：頭像上、文字下（128px）。
   */
  layout?: 'horizontal' | 'stacked';
};

export function MissionLevelBriefHeroComms({
  levelIds,
  rotateIntervalMs = DEFAULT_ROTATE_MS,
  layout = 'horizontal',
}: MissionLevelBriefHeroCommsProps) {
  const commsHero = HEROES.find((h) => h.id === COMMS_HERO_ID) ?? HEROES[0];
  const briefLines = useMemo(() => {
    if (levelIds.length === 0) return FALLBACK_LINES;
    const merged = mergeBriefLinesUnique(COMMS_HERO_ID, levelIds);
    return merged.length > 0 ? merged : FALLBACK_LINES;
  }, [levelIds]);

  const [lineIndex, setLineIndex] = useState(0);
  const line = briefLines[lineIndex % briefLines.length] ?? briefLines[0]!;
  const teletypeKey = `${levelIds.join(',')}-${lineIndex}`;

  useEffect(() => {
    setLineIndex(0);
  }, [briefLines]);

  useEffect(() => {
    if (briefLines.length <= 1) return;
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % briefLines.length);
    }, rotateIntervalMs);
    return () => window.clearInterval(id);
  }, [briefLines, rotateIntervalMs]);

  const avatar = layout === 'stacked' ? STACKED_AVATAR_PX : 44;

  const portrait = (
    <HeroPortraitZoomButton
      heroId={COMMS_HERO_ID}
      size={avatar}
      title={`放大檢視${commsHero.name}頭像`}
      aria-label={`放大檢視${commsHero.name}頭像`}
      className="relative shrink-0 cursor-zoom-in overflow-hidden rounded-full outline-none ring-offset-2 ring-offset-[#101218] focus-visible:ring-2 focus-visible:ring-amber-500/80"
      style={{
        width: avatar,
        height: avatar,
        boxShadow: '0 0 0 1px rgba(16,185,129,0.32), 0 0 4px rgba(16,185,129,0.14)',
      }}
    />
  );

  const text = (
    <p
      className={
        layout === 'stacked'
          ? 'w-full min-w-0 text-center text-sm leading-relaxed text-emerald-100/95 sm:text-base'
          : 'min-w-0 flex-1 pt-0.5 text-left text-sm leading-snug text-emerald-100/95 sm:text-base'
      }
      role="status"
      aria-live="polite"
      aria-label={`${commsHero.name} 戰術頻道`}
    >
      <TeletypeInline full={line} resetKey={teletypeKey} caretClassName="bg-[#FF9F1C]/80" />
    </p>
  );

  if (layout === 'stacked') {
    return (
      <div className="flex flex-col items-center gap-3">
        <span className="sr-only">{commsHero.name}</span>
        {portrait}
        {text}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <span className="sr-only">{commsHero.name}</span>
      {portrait}
      {text}
    </div>
  );
}
