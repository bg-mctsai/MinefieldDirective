const LS = 'md:heroUnlockDialoguesShown';

function normalize(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (typeof id !== 'string' || !id.trim() || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function loadShownHeroUnlockDialogueIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS);
    if (raw == null) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(
      normalize((arr as unknown[]).filter((x): x is string => typeof x === 'string')),
    );
  } catch {
    return new Set();
  }
}

/** 戰後通話播畢後寫入，避免重玩同關重複播放。 */
export function markHeroUnlockDialoguesShown(heroIds: string[]): void {
  const add = normalize(heroIds);
  if (add.length === 0) return;
  const cur = loadShownHeroUnlockDialogueIds();
  for (const id of add) cur.add(id);
  try {
    localStorage.setItem(LS, JSON.stringify([...cur]));
  } catch {
    /* ignore */
  }
}
