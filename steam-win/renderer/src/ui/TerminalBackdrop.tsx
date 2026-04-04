import type { ReactNode } from 'react';

/**
 * 軍事終端風格背景：深底、可選雷達錐、掃描線（首頁與選單頁共用）
 */
export function TerminalBackdrop({
  children,
  className = '',
  showRadar = false,
}: {
  children: ReactNode;
  className?: string;
  showRadar?: boolean;
}) {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-[#0B0E14] text-slate-200 ${className}`}>
      {showRadar && (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(16,185,129,0.25) 0%, transparent 45%), radial-gradient(circle at 50% 45%, transparent 38%, rgba(245,158,11,0.12) 39%, transparent 40%, transparent 58%, rgba(245,158,11,0.08) 59%, transparent 60%)',
            }}
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(120vw,120vh)] w-[min(120vw,120vh)] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]">
            <div
              className="radar-spin h-full w-full rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, rgba(16,185,129,0.5) 32deg, transparent 48deg)',
              }}
            />
          </div>
        </>
      )}
      <div className="pointer-events-none fixed inset-0 z-[100] opacity-40 mix-blend-overlay scanlines" />
      {children}
    </div>
  );
}
