import { Zap } from 'lucide-react';
import { MissionDirectiveEmblem } from '../game/MissionDirectiveEmblem';
import { HOME_TITLE_FULL } from './constants';

const TITLE_SEP = '：';
const FULL_TITLE = HOME_TITLE_FULL;

function splitTypedTitle(typed: string) {
  const c = typed.indexOf(TITLE_SEP);
  if (c === -1) {
    return { mainText: typed, subText: '', sepIdx: -1 as number };
  }
  return {
    mainText: typed.slice(0, c),
    subText: typed.slice(c + TITLE_SEP.length),
    sepIdx: c,
  };
}

function HudCorners() {
  const arm = 'h-3 w-3 md:h-3.5 md:w-3.5';
  const stroke = 'border-amber-400/75 shadow-[0_0_10px_rgba(251,191,36,0.25)]';
  return (
    <>
      <span className={`pointer-events-none absolute left-0 top-0 border-l-2 border-t-2 ${arm} ${stroke}`} />
      <span className={`pointer-events-none absolute right-0 top-0 border-r-2 border-t-2 ${arm} ${stroke}`} />
      <span className={`pointer-events-none absolute bottom-0 left-0 border-b-2 border-l-2 ${arm} ${stroke}`} />
      <span className={`pointer-events-none absolute bottom-0 right-0 border-b-2 border-r-2 ${arm} ${stroke}`} />
    </>
  );
}

/** 首頁主視覺：戰術 HUD + 霓虹標題（對齊主選單風格） */
export function HomeBrandLogo({ typedTitle }: { typedTitle: string }) {
  const { mainText, subText, sepIdx } = splitTypedTitle(typedTitle);
  const typing = typedTitle.length < FULL_TITLE.length;
  /** 已輸入分隔符「：」，游標改在副標 */
  const pastSeparator = sepIdx !== -1 && typedTitle.length > sepIdx;
  const caretOnMain = typing && !pastSeparator;
  const caretOnSub = typing && pastSeparator;

  const mainSize =
    'text-[clamp(1.65rem,4.2vw+0.4rem,2.85rem)] leading-[1.05] md:text-[clamp(2rem,3.2vw+0.85rem,3.15rem)]';
  const subSize = 'text-[clamp(0.95rem,1.6vw+0.55rem,1.35rem)] leading-tight md:text-[clamp(1.05rem,1.1vw+0.65rem,1.5rem)]';

  return (
    <div className="relative inline-block max-w-full pl-0.5 pr-1 pt-0.5 pb-1 md:pl-1 md:pr-1.5 md:pt-1 md:pb-1.5">
      <HudCorners />
      <div className="relative flex items-stretch gap-2.5 md:gap-4">
        <div className="relative flex shrink-0 items-center justify-center pt-5 md:pt-6">
          <div
            className="pointer-events-none absolute flex items-center justify-center"
            aria-hidden
          >
            <div className="h-[2.85rem] w-[2.85rem] rounded-full border border-amber-500/20 md:h-[3.35rem] md:w-[3.35rem]" />
            <div className="radar-spin absolute h-[2.85rem] w-[2.85rem] rounded-full border-t-[2.5px] border-amber-400/45 border-r-transparent border-b-transparent border-l-transparent opacity-90 md:h-[3.35rem] md:w-[3.35rem]" />
          </div>
          <MissionDirectiveEmblem
            className="relative text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]"
            size={46}
          />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.42em] text-amber-300/90 md:text-[10px] md:tracking-[0.48em]">
            <Zap
              className="size-3 shrink-0 text-amber-200 drop-shadow-[0_0_8px_rgba(253,224,71,0.75)] md:size-3.5"
              strokeWidth={2.4}
              aria-hidden
            />
            <span className="select-none opacity-95" aria-hidden>
              · − · · − − ·
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-x-1">
            <h1 className={`relative inline-block font-black tracking-[0.03em] ${mainSize}`}>
              <span
                className="pointer-events-none absolute left-0 top-0 select-none text-amber-500/40 blur-[5px] md:blur-[6px]"
                aria-hidden
              >
                {mainText}
              </span>
              <span className="relative bg-gradient-to-b from-[#FFFCE8] via-[#FFD34D] to-[#EA580C] bg-clip-text text-transparent">
                {mainText}
              </span>
            </h1>
            {caretOnMain && (
              <span className="ops-typing-caret mb-0.5 inline-block translate-y-px text-amber-300 md:mb-1">▍</span>
            )}
          </div>

          {(pastSeparator || subText.length > 0) && (
            <div className="mt-1 flex flex-wrap items-end gap-x-1 md:mt-1.5">
              <p className={`relative inline-block font-black tracking-[0.12em] ${subSize}`}>
                <span
                  className="pointer-events-none absolute left-0 top-0 select-none text-amber-600/35 blur-[3px] md:blur-[4px]"
                  aria-hidden
                >
                  {subText}
                </span>
                <span className="relative bg-gradient-to-b from-[#FFEFB8] via-[#FBBF24] to-[#C2410C] bg-clip-text text-transparent">
                  {subText}
                </span>
              </p>
              {caretOnSub && (
                <span className="ops-typing-caret mb-px inline-block text-amber-300/95">▍</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
