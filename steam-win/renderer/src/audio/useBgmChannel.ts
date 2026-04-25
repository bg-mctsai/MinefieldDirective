import { useEffect } from 'react';
import { AudioEngine } from './AudioEngine';
import type { AudioEventKey } from './audioEventCatalog';

/** 場景別名 → BGM 事件 key */
const SCENE_MAP: Record<string, AudioEventKey> = {
  base: 'bgm.home.settings',
  settings: 'bgm.home.settings',
  mission: 'bgm.home.settings',
  combat: 'bgm.combat.loop',
};

export type BgmScene = keyof typeof SCENE_MAP | null;

/**
 * 掛載/切換/卸載 BGM 循環的 React hook。
 * - 同一時間只有一條 BGM，切換自動淡出舊、淡入新。
 * - `scene` 傳 null 代表本場景無 BGM（或明確關閉）。
 * - 卸載時不強制停 BGM（交由下一個掛載的場景切換），避免頁面間靜音閃爍。
 *
 * 若要「離開頁面立刻停音」，請在該頁 unmount 前呼叫 `AudioEngine.stopAllLoops()`。
 */
export function useBgmChannel(scene: BgmScene) {
  useEffect(() => {
    if (!scene) return;
    const targetKey = SCENE_MAP[scene];
    if (!targetKey) return;

    // 先停掉其他 BGM，再起新的；engine 會淡出淡入
    const current = targetKey;
    Object.values(SCENE_MAP).forEach((k) => {
      if (k !== current) AudioEngine.stopLoop(k, 0.6);
    });
    void AudioEngine.startLoop(current);
  }, [scene]);
}
