import { useEffect, useState } from 'react';
import { getStoredHeroId, HERO_CHANGED_EVENT } from '../heroes';

/** 對局內目前出戰幹員；與 localStorage 及整備／作戰地圖切換同步 */
export function useCombatHeroId(): string {
  const [heroId, setHeroId] = useState(() => getStoredHeroId());

  useEffect(() => {
    const sync = () => setHeroId(getStoredHeroId());
    const onHeroChanged = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      setHeroId(id && id.length > 0 ? id : getStoredHeroId());
    };
    window.addEventListener(HERO_CHANGED_EVENT, onHeroChanged);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(HERO_CHANGED_EVENT, onHeroChanged);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return heroId;
}
