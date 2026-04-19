/**
 * 戰鬥內動態工兵台詞：六種觸發、依 heroId 切換文案
 * - opening：第一次選電報後 800ms（用 placedInTurn 從 0 變 ≥1 取代「選電報」事件，
 *            因為 placedInTurn 在第一次成功放置後變 1；無 placement 事件時退而用 timerStarted 開始計時）
 * - lastTen：secondsLeft <= 10 第一次
 * - idle：timerStarted 後 18 秒沒有 placedInTurn 變化
 * - good：placedInTurn 從 1 → 2（成功一回合）
 * - bad：status 切到 exploding | lost
 * - victory：status 切到 won
 *
 * 顯示沿用既有 supportBarrage 機制，hook 只回傳當前 barrage 與 heroId；
 * 渲染端根據 tone 切換是否套紅色脈動描邊。
 */
import { useEffect, useRef, useState } from 'react';
import { getHeroDef, getStoredHeroId, type HeroBarrageTrigger, type HeroDef } from '../heroes';
import type { GameState } from './types';

/** 對外的 barrage 物件 */
export interface HeroBarrageOut {
  id: number;
  text: string;
  /** 0~2 軌道，避免疊在同一行 */
  lane: number;
  /** 'normal' | 'alert'：alert 顯示紅色脈動描邊 */
  tone: 'normal' | 'alert';
}

const COOLDOWN_MS = 9000;
const BARRAGE_TTL_MS = 4400;
const IDLE_AFTER_MS = 18000;
const OPENING_DELAY_MS = 800;

function pickLine(hero: HeroDef, trigger: HeroBarrageTrigger): string | null {
  const pool = hero.barrage?.[trigger];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function useDynamicHeroBarrage(gameState: GameState): HeroBarrageOut | null {
  const [barrage, setBarrage] = useState<HeroBarrageOut | null>(null);
  const heroIdRef = useRef<string>(getStoredHeroId());
  const cooldownUntilRef = useRef(0);
  const hasOpeningRef = useRef(false);
  const hasLastTenRef = useRef(false);
  const lastPlacedInTurnRef = useRef<number>(gameState.placedInTurn);
  const lastChangeMsRef = useRef<number>(Date.now());
  const idleFiredRef = useRef(false);
  const prevStatusRef = useRef<GameState['status']>(gameState.status);
  const openingTimerRef = useRef<number | null>(null);

  // 局與局之間重置
  useEffect(() => {
    heroIdRef.current = getStoredHeroId();
    cooldownUntilRef.current = 0;
    hasOpeningRef.current = false;
    hasLastTenRef.current = false;
    lastPlacedInTurnRef.current = 0;
    lastChangeMsRef.current = Date.now();
    idleFiredRef.current = false;
    prevStatusRef.current = gameState.status;
    if (openingTimerRef.current != null) {
      window.clearTimeout(openingTimerRef.current);
      openingTimerRef.current = null;
    }
    setBarrage(null);
  }, [gameState.gameId]);

  // barrage TTL：每個 barrage 顯示固定時間後自然消失
  useEffect(() => {
    if (!barrage) return;
    const id = window.setTimeout(() => setBarrage(null), BARRAGE_TTL_MS);
    return () => window.clearTimeout(id);
  }, [barrage]);

  // 主觸發 effect：依狀態切換選擇要丟哪一種 barrage
  useEffect(() => {
    const hero = getHeroDef(heroIdRef.current);
    const now = Date.now();

    const push = (trigger: HeroBarrageTrigger, tone: HeroBarrageOut['tone'] = 'normal') => {
      if (now < cooldownUntilRef.current) return;
      const text = pickLine(hero, trigger);
      if (!text) return;
      cooldownUntilRef.current = now + COOLDOWN_MS;
      setBarrage({
        id: now + Math.floor(Math.random() * 999),
        text,
        lane: Math.floor(Math.random() * 3),
        tone,
      });
    };

    const prevStatus = prevStatusRef.current;
    const currStatus = gameState.status;

    // 5. bad：status 切到 exploding | lost
    if ((currStatus === 'exploding' || currStatus === 'lost') && prevStatus === 'playing') {
      push('bad', 'alert');
    }
    // 6. victory：status 切到 won
    if (currStatus === 'won' && prevStatus !== 'won') {
      push('victory');
    }

    // 4. good：placedInTurn 從 1 → 2 的瞬間（一回合 2 顆全部部署完）
    if (
      currStatus === 'playing' &&
      gameState.placedInTurn === 2 &&
      lastPlacedInTurnRef.current === 1
    ) {
      push('good');
    }

    // 偵測 placedInTurn 變化（用於 idle 計時 + opening 觸發）
    if (gameState.placedInTurn !== lastPlacedInTurnRef.current) {
      lastChangeMsRef.current = now;
      idleFiredRef.current = false;
      // 1. opening：第一次成功放置後 800ms（避免與章節簡報重疊）
      if (
        currStatus === 'playing' &&
        !hasOpeningRef.current &&
        gameState.placedInTurn === 1 &&
        lastPlacedInTurnRef.current === 0
      ) {
        hasOpeningRef.current = true;
        if (openingTimerRef.current != null) window.clearTimeout(openingTimerRef.current);
        openingTimerRef.current = window.setTimeout(() => {
          push('opening');
          openingTimerRef.current = null;
        }, OPENING_DELAY_MS);
      }
      lastPlacedInTurnRef.current = gameState.placedInTurn;
    }

    // 2. lastTen：secondsLeft <= 10 第一次（且實際在倒數）
    if (
      currStatus === 'playing' &&
      gameState.timerStarted &&
      gameState.secondsLeft != null &&
      gameState.secondsLeft <= 10 &&
      gameState.secondsLeft > 0 &&
      !hasLastTenRef.current
    ) {
      hasLastTenRef.current = true;
      // 倒數最後 5 秒視為危急
      const tone = gameState.secondsLeft <= 5 ? 'alert' : 'normal';
      push('lastTen', tone);
    }

    // 3. idle：timerStarted 之後 18 秒無 placement 變化
    if (
      currStatus === 'playing' &&
      gameState.timerStarted &&
      !idleFiredRef.current &&
      now - lastChangeMsRef.current >= IDLE_AFTER_MS
    ) {
      idleFiredRef.current = true;
      push('idle');
    }

    prevStatusRef.current = currStatus;
  }, [
    gameState.status,
    gameState.placedInTurn,
    gameState.secondsLeft,
    gameState.timerStarted,
    gameState.gameId,
  ]);

  return barrage;
}
