import homeLogo from '../assets/mission-hex-badges/logo.png';

/** 首頁主視覺：僅保留置中戰術徽章 */
export function HomeBrandLogo() {
  return (
    <div className="relative inline-block max-w-full px-2 pt-1 pb-1 md:px-3 md:pt-1 md:pb-1.5">
      <div className="relative flex flex-col items-center">
        <div className="relative flex shrink-0 items-center justify-center pt-1 md:pt-1.5">
          <div
            className="pointer-events-none absolute flex items-center justify-center"
            aria-hidden
          >
            <div className="h-[8.25rem] w-[8.25rem] rounded-full border border-amber-500/26 md:h-[10rem] md:w-[10rem]" />
            <div className="radar-spin absolute h-[8.25rem] w-[8.25rem] rounded-full border-t-[2.5px] border-amber-400/52 border-r-transparent border-b-transparent border-l-transparent opacity-90 md:h-[10rem] md:w-[10rem]" />
          </div>
          <img
            src={homeLogo}
            alt="Minefield Directive Logo"
            className="relative h-[12rem] w-[12rem] scale-[1.6] object-contain drop-shadow-[0_0_42px_rgba(251,191,36,0.68)] md:h-[14rem] md:w-[14rem] md:scale-[1.6]"
          />
        </div>
      </div>
    </div>
  );
}
