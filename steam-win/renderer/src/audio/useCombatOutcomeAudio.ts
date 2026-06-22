import { useEffect, useRef } from 'react';
import { AudioEngine, emit } from './AudioEngine';
import { useAudioSettings } from './AudioSettingsContext';

type OutcomeGameState = {
  gameId: number;
  status: 'playing' | 'won' | 'lost' | 'exploding';
};

/**
 * 戰場輸贏音訊：
 * - 敗北連鎖（exploding / lost）停止戰鬥 BGM，讓爆炸與結算音效不被蓋過。
 * - 過關播放凱旋樂曲，約 0.4s 後無線電回報「我們贏了」，並淡出 BGM。
 * - 新一局（gameId 變更且 status === playing）恢復戰鬥 BGM。
 */
export function useCombatOutcomeAudio(gameState: OutcomeGameState | null | undefined) {
  const { settings } = useAudioSettings();
  const victoryEmittedForGameId = useRef<number | null>(null);

  useEffect(() => {
    if (!gameState) return;

    if (gameState.status === 'exploding' || gameState.status === 'lost') {
      AudioEngine.stopLoop('bgm.combat.loop', 0.8);
      return;
    }

    if (gameState.status === 'won') {
      if (victoryEmittedForGameId.current === gameState.gameId) return;
      victoryEmittedForGameId.current = gameState.gameId;
      emit('game.victory');
      window.setTimeout(() => emit('vo.combat.victory'), 360);
      AudioEngine.stopLoop('bgm.combat.loop', 1.0);
    }
  }, [gameState?.gameId, gameState?.status]);

  useEffect(() => {
    if (!gameState || gameState.status !== 'playing' || !settings.bgmEnabled) return;
    void AudioEngine.startLoop('bgm.combat.loop');
  }, [gameState?.gameId, gameState?.status, settings.bgmEnabled]);
}
