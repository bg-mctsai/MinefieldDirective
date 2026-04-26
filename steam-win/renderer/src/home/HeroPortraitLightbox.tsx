import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { getHeroDef } from '../heroes';
import { getHeroPortraitUrl, HeroAvatarSilhouette } from './HeroAvatarSilhouette';

/** commander 不在 HEROES；getHeroDef 會誤回傳第一人（小明） */
function portraitLightboxCaption(heroId: string): { name: string; role: string } {
  if (heroId === 'commander') {
    return { name: '指揮官', role: '戰區長官' };
  }
  const h = getHeroDef(heroId);
  return { name: h.name, role: h.role };
}

type PortraitLightboxContextValue = {
  openPortrait: (heroId: string) => void;
  closePortrait: () => void;
};

const PortraitLightboxContext = createContext<PortraitLightboxContextValue | null>(null);

export function useHeroPortraitLightbox(): PortraitLightboxContextValue {
  const v = useContext(PortraitLightboxContext);
  if (!v) throw new Error('useHeroPortraitLightbox must be used within HeroPortraitLightboxProvider');
  return v;
}

function PortraitLightboxOverlay({ heroId, onClose }: { heroId: string; onClose: () => void }) {
  const caption = portraitLightboxCaption(heroId);
  const hasPortrait = getHeroPortraitUrl(heroId) != null;

  useEffect(() => {
    if (!hasPortrait) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [hasPortrait]);

  useEffect(() => {
    if (!hasPortrait) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasPortrait, onClose]);

  if (!hasPortrait) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="hero-portrait-lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="fixed inset-0 z-[500] flex items-center justify-center p-5 sm:p-8"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/72 backdrop-blur-[3px]"
          aria-label="關閉頭像預覽"
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hero-portrait-lightbox-title"
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="relative z-[1] w-full max-w-[min(92vw,22rem)] rounded-2xl border-2 border-slate-600/90 bg-slate-950/96 p-5 shadow-2xl ring-1 ring-black/50"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="關閉"
            onClick={onClose}
          >
            <X size={20} strokeWidth={2.25} />
          </button>
          <div className="flex flex-col items-center gap-3 pt-5">
            <HeroAvatarSilhouette heroId={heroId} size={256} />
            <div className="text-center">
              <h2 id="hero-portrait-lightbox-title" className="text-lg font-black tracking-tight text-white">
                {caption.name}
              </h2>
              <p className="mt-0.5 text-sm font-bold text-amber-400/90">{caption.role}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

export function HeroPortraitLightboxProvider({ children }: { children: ReactNode }) {
  const [heroId, setHeroId] = useState<string | null>(null);

  const openPortrait = useCallback((id: string) => {
    if (getHeroPortraitUrl(id)) setHeroId(id);
  }, []);

  const closePortrait = useCallback(() => {
    setHeroId(null);
  }, []);

  const value = useMemo(
    () => ({ openPortrait, closePortrait }),
    [openPortrait, closePortrait],
  );

  return (
    <PortraitLightboxContext.Provider value={value}>
      {children}
      {heroId != null ? <PortraitLightboxOverlay heroId={heroId} onClose={closePortrait} /> : null}
    </PortraitLightboxContext.Provider>
  );
}
