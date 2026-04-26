import type { CSSProperties } from 'react';
import { HeroAvatarSilhouette } from './HeroAvatarSilhouette';
import { useHeroPortraitLightbox } from './HeroPortraitLightbox';

type HeroPortraitZoomButtonProps = {
  heroId: string;
  size?: number;
  title?: string;
  ariaLabel?: string;
  className?: string;
  avatarClassName?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

/** 可重用：點擊後開啟幹員大頭像 lightbox */
export function HeroPortraitZoomButton({
  heroId,
  size = 40,
  title,
  ariaLabel,
  className = '',
  avatarClassName = '',
  style,
  onClick,
}: HeroPortraitZoomButtonProps) {
  const { openPortrait } = useHeroPortraitLightbox();

  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel ?? title ?? '放大檢視頭像'}
      onClick={() => {
        openPortrait(heroId);
        onClick?.();
      }}
      className={`cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-amber-500/80 ${className}`.trim()}
      style={style}
    >
      <span className="relative block">
        <HeroAvatarSilhouette heroId={heroId} size={size} className={avatarClassName} />
        <span
          className="pointer-events-none absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-amber-500/55 bg-slate-950/96 text-[10px] font-black leading-none text-amber-400 ring-1 ring-black/45"
          aria-hidden
        >
          +
        </span>
      </span>
    </button>
  );
}
