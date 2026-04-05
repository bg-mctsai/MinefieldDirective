import { motion } from 'motion/react';
import { Cloud } from './Cloud';
import type { MapCloudOverlayConfig } from '../levelData/types';

type DustPatchDef = {
  /** 中心 X（相對棋盤寬，0..1） */
  xFrac: number;
  /** 中心 Y（相對棋盤高，0..1） */
  yFrac: number;
  /** 寬度（相對棋盤寬） */
  wFrac: number;
  /** 高度（相對棋盤高） */
  hFrac: number;
  /** 透明度倍率 */
  opScale: number;
  /** 整個生命週期秒數（出現 + 停留 + 消散） */
  lifeSec: number;
  /** 初始延遲秒數 */
  delay: number;
  /** 消散後靜歇秒數，拉長讓整體稀疏 */
  restSec: number;
  /** 沙色變體 0/1/2 */
  colorVariant: number;
  /** blur 縮放倍率 */
  blurScale: number;
};

// 5 塊小範圍沙塵：各自佔棋盤約 30~45%，出現在不同區域
const DUST_DEFS: DustPatchDef[] = [
  { xFrac: 0.25, yFrac: 0.28, wFrac: 0.42, hFrac: 0.38, opScale: 1.00, lifeSec: 15, delay:  0, restSec: 38, colorVariant: 0, blurScale: 1.10 },
  { xFrac: 0.72, yFrac: 0.62, wFrac: 0.38, hFrac: 0.35, opScale: 0.88, lifeSec: 12, delay:  9, restSec: 42, colorVariant: 1, blurScale: 0.95 },
  { xFrac: 0.60, yFrac: 0.25, wFrac: 0.44, hFrac: 0.32, opScale: 0.92, lifeSec: 14, delay: 20, restSec: 40, colorVariant: 2, blurScale: 1.00 },
  { xFrac: 0.30, yFrac: 0.70, wFrac: 0.36, hFrac: 0.38, opScale: 0.82, lifeSec: 11, delay: 30, restSec: 44, colorVariant: 0, blurScale: 0.88 },
  { xFrac: 0.68, yFrac: 0.42, wFrac: 0.40, hFrac: 0.36, opScale: 0.95, lifeSec: 17, delay:  5, restSec: 36, colorVariant: 1, blurScale: 1.05 },
];

/**
 * 沙塵暴效果：沙塵靜止出現（最模糊）後慢慢消散。
 * 無橫移，純 opacity＋scale 動畫，避免視覺過度刺激。
 */
export function MapCloudOverlay({
  config,
  boardWidthPx,
  boardHeightPx,
}: {
  config: MapCloudOverlayConfig;
  boardWidthPx: number;
  boardHeightPx: number;
}) {
  const { periodSec = 18, opacity = 0.52, blurPx = 28 } = config;

  const baseOpacity = Math.min(1, Math.max(0.2, opacity));
  const cycleSec = Math.max(10, periodSec);
  const speedMult = cycleSec / 15;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[8] overflow-hidden rounded-[inherit]"
      aria-hidden
    >
      {DUST_DEFS.map((patch) => {
        const patchW = boardWidthPx * patch.wFrac;
        const patchH = boardHeightPx * patch.hFrac;
        const patchLeft = boardWidthPx * patch.xFrac - patchW / 2;
        const patchTop = boardHeightPx * patch.yFrac - patchH / 2;

        const op = baseOpacity * patch.opScale;
        const life = patch.lifeSec * speedMult;
        const rest = patch.restSec * speedMult;

        // 出現 15%、停留到 35%、緩慢消散到 100%
        // scale 在消散期間略微膨脹，加強「散開」感
        return (
          <motion.div
            key={patch.delay}
            className="absolute overflow-visible"
            style={{
              top: patchTop,
              left: patchLeft,
              width: patchW,
              height: patchH,
              willChange: 'transform, opacity',
            }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{
              opacity: [0, op, op, op * 0.4, 0],
              scale:   [0.94, 1.0, 1.02, 1.08, 1.14],
            }}
            transition={{
              duration: life,
              times: [0, 0.15, 0.35, 0.72, 1.0],
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: rest,
              delay: patch.delay,
            }}
          >
            <Cloud
              widthPx={patchW}
              heightPx={patchH}
              opacity={op}
              blurPx={blurPx * patch.blurScale}
              breatheSec={Math.max(4, life * 0.4)}
              colorVariant={patch.colorVariant}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
