/**
 * 幹員頭像：在編幹員＋指揮官 WebP 大頭照；其餘 id 仍用幾何 SVG 剪影
 */
import type { CSSProperties } from 'react';

import adaPortrait from '../assets/heroes/preview-unified-cyberpunk/preview-unified-hero-ada.png';
import bobbyPortrait from '../assets/heroes/preview-unified-cyberpunk/preview-unified-hero-bobby-v2-young.png';
import commanderPortrait from '../assets/heroes/preview-unified-cyberpunk/preview-unified-hero-commander-v2-indoor.png';
import laozhangPortrait from '../assets/heroes/preview-unified-cyberpunk/preview-unified-hero-laozhang-v2-helmet.png';
import selinaPortrait from '../assets/heroes/preview-unified-cyberpunk/preview-unified-hero-selina.png';
import xiaomingPortrait from '../assets/heroes/preview-unified-cyberpunk/preview-unified-hero-xiaoming-v3-recruit-fix.png';

export type HeroAvatarVariant = 'recruit' | 'engineer' | 'veteran';

const VARIANT_BY_HERO: Record<string, HeroAvatarVariant> = {
  xiaoming: 'recruit',
  laozhang: 'veteran',
  commander: 'veteran',
  ada: 'engineer',
  bobby: 'recruit',
  selina: 'recruit',
};

const PORTRAIT_BY_HERO: Record<string, string> = {
  xiaoming: xiaomingPortrait,
  laozhang: laozhangPortrait,
  commander: commanderPortrait,
  ada: adaPortrait,
  bobby: bobbyPortrait,
  selina: selinaPortrait,
};

export function variantFromHeroId(id: string): HeroAvatarVariant {
  return VARIANT_BY_HERO[id] ?? 'recruit';
}

/** 有 WebP 大頭照的幹員／指揮官 id；供頭像放大層判斷 */
export function getHeroPortraitUrl(heroId: string): string | undefined {
  return PORTRAIT_BY_HERO[heroId];
}

export function HeroAvatarSilhouette({
  heroId,
  size = 96,
  className = '',
  style,
}: {
  heroId: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const portraitSrc = PORTRAIT_BY_HERO[heroId];
  if (portraitSrc) {
    const radius = Math.round(size * 0.16);
    return (
      <img
        src={portraitSrc}
        alt=""
        width={size}
        height={size}
        draggable={false}
        decoding="async"
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          objectPosition: 'center center',
          borderRadius: radius,
          ...style,
        }}
      />
    );
  }

  const variant = variantFromHeroId(heroId);
  const stroke = '#F59E0B';
  const fill = '#0B0E14';
  const accent = '#10B981';
  const dim = '#1e293b';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden
    >
      <defs>
        <radialGradient id={`bg-${variant}`} cx="50%" cy="38%" r="60%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="60%" stopColor={fill} stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`circuit-${variant}`}
          x="0"
          y="0"
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 7 H14 M7 0 V14"
            stroke={accent}
            strokeWidth="0.4"
            opacity="0.35"
          />
          <circle cx="7" cy="7" r="1" fill={accent} opacity="0.45" />
        </pattern>
      </defs>

      <rect x="2" y="2" width="96" height="96" rx="16" fill={fill} />
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="16"
        fill={`url(#bg-${variant})`}
      />
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="13"
        fill="none"
        stroke={dim}
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      <g transform="translate(50 56)">
        <path
          d="M-30 30 Q -28 18 -16 14 L 16 14 Q 28 18 30 30 Z"
          fill={dim}
          stroke={stroke}
          strokeOpacity="0.55"
          strokeWidth="0.8"
        />
        <rect x="-7" y="6" width="14" height="10" fill={dim} />

        {variant === 'recruit' && (
          <g>
            <path
              d="M-22 -2 Q -22 -28 0 -30 Q 22 -28 22 -2 L 18 4 L -18 4 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.4"
            />
            <path
              d="M-22 -2 L 22 -2"
              stroke={stroke}
              strokeOpacity="0.5"
              strokeWidth="0.8"
            />
            <rect x="-4" y="-30" width="8" height="4" fill={stroke} />
            <rect x="-2" y="-34" width="4" height="4" fill={stroke} />
            <rect x="-23" y="-6" width="4" height="10" rx="2" fill={dim} stroke={stroke} strokeOpacity="0.5" />
            <rect x="19" y="-6" width="4" height="10" rx="2" fill={dim} stroke={stroke} strokeOpacity="0.5" />
            <path d="M-14 -4 Q 0 8 14 -4 L 14 4 L -14 4 Z" fill={dim} />
            <path
              d="M-22 -2 Q -22 -28 0 -30 Q 22 -28 22 -2 L 18 4 L -18 4 Z"
              fill={`url(#circuit-${variant})`}
              opacity="0.55"
            />
          </g>
        )}

        {variant === 'engineer' && (
          <g>
            <path
              d="M-24 0 Q -24 -22 0 -24 Q 24 -22 24 0 L 20 4 L -20 4 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.4"
            />
            <rect x="-18" y="-4" width="36" height="8" rx="3" fill={dim} stroke={stroke} strokeWidth="1" />
            <line x1="-1" y1="-4" x2="-1" y2="4" stroke={stroke} strokeWidth="0.6" />
            <circle cx="-9" cy="0" r="2.2" fill={accent} opacity="0.7" />
            <circle cx="9" cy="0" r="2.2" fill={accent} opacity="0.7" />
            <circle cx="0" cy="-18" r="3" fill={stroke} />
            <circle cx="0" cy="-18" r="1.4" fill="#fff" opacity="0.85" />
            <path
              d="M-24 0 L 24 0"
              stroke={stroke}
              strokeOpacity="0.55"
            />
            <path
              d="M-24 0 Q -24 -22 0 -24 Q 24 -22 24 0"
              fill={`url(#circuit-${variant})`}
              opacity="0.5"
            />
          </g>
        )}

        {variant === 'veteran' && (
          <g>
            <path
              d="M-24 -2 Q -24 -30 0 -32 Q 24 -30 24 -2 L 26 0 L 24 6 L -24 6 L -26 0 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
            />
            <line x1="-22" y1="2" x2="22" y2="2" stroke={stroke} strokeOpacity="0.7" strokeWidth="0.8" />
            <polygon
              points="0,-20 1.6,-15 6.6,-15 2.5,-12 4,-7 0,-10 -4,-7 -2.5,-12 -6.6,-15 -1.6,-15"
              fill={stroke}
            />
            <path d="M-18 -10 L -10 -16" stroke={stroke} strokeWidth="1.2" opacity="0.7" />
            <path d="M14 -8 L 18 -14" stroke={stroke} strokeWidth="1" opacity="0.6" />
            <path d="M-14 -2 L 14 -2 L 12 6 L -12 6 Z" fill={dim} />
            <path d="M-10 0 L 10 0" stroke={stroke} strokeOpacity="0.4" strokeWidth="0.6" />
            <path
              d="M-24 -2 Q -24 -30 0 -32 Q 24 -30 24 -2 L 26 0 L 24 6 L -24 6 L -26 0 Z"
              fill={`url(#circuit-${variant})`}
              opacity="0.4"
            />
          </g>
        )}
      </g>

      <g stroke={stroke} strokeWidth="1.2" opacity="0.85">
        <path d="M8 14 L 8 8 L 14 8" fill="none" />
        <path d="M86 8 L 92 8 L 92 14" fill="none" />
        <path d="M92 86 L 92 92 L 86 92" fill="none" />
        <path d="M14 92 L 8 92 L 8 86" fill="none" />
      </g>
    </svg>
  );
}
