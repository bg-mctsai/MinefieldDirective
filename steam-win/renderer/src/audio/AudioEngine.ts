/**
 * 統一音訊引擎：單例 AudioContext + bus 匯流 + limiter + cooldown + ducking。
 *
 * 設計重點：
 * - 所有 synth 只能接到 engine 提供的 busNode，不可自建 context 或接 destination。
 * - 事件節流在 engine 層完成（cooldown），避免 call site 各自處理。
 * - 首次互動前 context 處於 suspended，首次 emit 會嘗試 resume（瀏覽器政策）。
 * - ducking 使用乘法疊加：多重 duck 取最低值（min），避免彼此覆寫造成破音。
 *
 * 效能：
 * - 零額外 dependency、零 polling；所有 ramp 都用 Web Audio 的排程 API。
 * - synth 以 code-split 的動態 import 載入，首屏不拉全部合成器。
 */

import {
  AUDIO_EVENT_CATALOG,
  type AudioBusId,
  type AudioDuckSpec,
  type AudioEventKey,
  type AudioEventParamsMap,
  type AudioEventDef,
} from './audioEventCatalog';
import type { SynthModule, SynthStopHandle } from './synthContract';

type BusId = Exclude<AudioBusId, 'master'>;

type BusNode = {
  id: AudioBusId;
  /** synth 連到的輸入點（= gain） */
  input: GainNode;
  /** 使用者設定的原始 gain（0~1） */
  userGain: number;
  /** 當前疊加的 duck 倍率（多重 duck 的最小值；1 = 無壓制） */
  duckMul: number;
  /** 正在生效的 duck 結束時間戳（ctx.currentTime），過期即可忽略 */
  activeDucks: { mul: number; endsAt: number }[];
};

type LoopHandle = {
  key: AudioEventKey;
  stop: SynthStopHandle['stop'];
};

const SYNTH_LOADERS: Record<string, () => Promise<{ default: SynthModule } | SynthModule>> = {
  uiHover: () => import('./synths/uiHover'),
  uiConfirm: () => import('./synths/uiConfirm'),
  uiBriefingOpen: () => import('./synths/uiBriefingOpen'),
  uiBriefingClose: () => import('./synths/uiBriefingClose'),
  uiSelectChangeDing: () => import('./synths/uiSelectChangeDing'),
  teletypeBlip: () => import('./synths/teletypeBlip'),
  gameCountdownTick: () => import('./synths/gameCountdownTick'),
  gameTimeUp: () => import('./synths/gameTimeUp'),
  gamePlaceNumber: () => import('./synths/gamePlaceNumber'),
  gameBobbyDownshift: () => import('./synths/gameBobbyDownshift'),
  gameExplosionPop: () => import('./synths/gameExplosionPop'),
  gameVictory: () => import('./synths/gameVictory'),
  voVictoryWeWon: () => import('./synths/voVictoryWeWon'),
  bgmBaseAmbience: () => import('./synths/bgmBaseAmbience'),
  bgmCombatLoop: () => import('./synths/bgmCombatLoop'),
  bgmSettingsGlass: () => import('./synths/bgmSettingsGlass'),
  bgmHomeThirdWire: () => import('./synths/bgmHomeThirdWire'),
};

const synthCache = new Map<string, SynthModule>();

async function loadSynth(synthId: string): Promise<SynthModule | null> {
  const cached = synthCache.get(synthId);
  if (cached) return cached;
  const loader = SYNTH_LOADERS[synthId];
  if (!loader) return null;
  try {
    const mod = await loader();
    const resolved: SynthModule =
      (mod as { default?: SynthModule }).default ?? (mod as SynthModule);
    synthCache.set(synthId, resolved);
    return resolved;
  } catch {
    return null;
  }
}

class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private buses: Map<BusId, BusNode> = new Map();
  private masterBus: BusNode | null = null;
  private lastEmitAt: Map<AudioEventKey, number> = new Map();
  private loops: Map<AudioEventKey, LoopHandle> = new Map();
  private pendingLoopStarts: Set<AudioEventKey> = new Set();

  /** 延遲建 ctx：避免 SSR/非瀏覽器環境；首次 emit 時建立 */
  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.buildGraph(ctx);
      return ctx;
    } catch {
      return null;
    }
  }

  private buildGraph(ctx: AudioContext) {
    const master = ctx.createGain();
    master.gain.value = 1;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;

    master.connect(limiter);
    limiter.connect(ctx.destination);

    this.master = master;
    this.limiter = limiter;

    const makeBus = (id: AudioBusId, gain: number): BusNode => {
      const g = ctx.createGain();
      g.gain.value = gain;
      g.connect(master);
      return { id, input: g, userGain: gain, duckMul: 1, activeDucks: [] };
    };

    this.masterBus = {
      id: 'master',
      input: master,
      userGain: 1,
      duckMul: 1,
      activeDucks: [],
    };

    const ui = makeBus('ui', 0.9);
    const sfx = makeBus('sfx', 1.0);
    const vo = makeBus('vo', 1.0);
    const bgm = makeBus('bgm', 0.55);
    this.buses.set('ui', ui);
    this.buses.set('sfx', sfx);
    this.buses.set('vo', vo);
    this.buses.set('bgm', bgm);
  }

  private getBusInput(id: BusId): GainNode | null {
    const bus = this.buses.get(id);
    return bus ? bus.input : null;
  }

  /** 讀取使用者音量設定（不含 duck）；ctx 未建立時回傳預設值 */
  getBusUserGain(busId: AudioBusId): number {
    if (busId === 'master') return this.masterBus?.userGain ?? 1;
    return this.buses.get(busId)?.userGain ?? 1;
  }

  /** 使用者音量設定；會立即生效於 bus gain（結合 duckMul） */
  setBusGain(busId: AudioBusId, value01: number) {
    const clamped = Math.min(1, Math.max(0, value01));
    this.ensureCtx();
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const applyTo = (bus: BusNode, target: number) => {
      const g = bus.input.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(target, now + 0.04);
    };
    if (busId === 'master') {
      if (!this.masterBus) return;
      this.masterBus.userGain = clamped;
      applyTo(this.masterBus, clamped * this.masterBus.duckMul);
      return;
    }
    const bus = this.buses.get(busId);
    if (!bus) return;
    bus.userGain = clamped;
    // 使用者手動調整時強制清除殘餘 duck 狀態（常見於切場景時）
    bus.activeDucks = [];
    bus.duckMul = 1;
    applyTo(bus, clamped);
  }

  private applyDuck(bus: BusNode, spec: AudioDuckSpec, ctx: AudioContext) {
    const now = ctx.currentTime;
    bus.activeDucks = bus.activeDucks.filter((d) => d.endsAt > now);
    bus.activeDucks.push({ mul: spec.gainMul, endsAt: now + spec.durationSec });
    const mul = bus.activeDucks.reduce((m, d) => Math.min(m, d.mul), 1);
    bus.duckMul = mul;
    const target = bus.userGain * mul;
    const attack = 0.02;
    const releaseStart = Math.max(0.05, spec.durationSec - attack);
    const g = bus.input.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    // attack：短時間內降到 target
    g.linearRampToValueAtTime(target, now + attack);
    // sustain：持續到 release 開始
    g.setValueAtTime(target, now + releaseStart);
    // release：平滑回 userGain
    g.linearRampToValueAtTime(bus.userGain, now + releaseStart + attack);
    // 到期強制復位，避免殘留狀態
    window.setTimeout(
      () => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        bus.activeDucks = bus.activeDucks.filter((d) => d.endsAt > t);
        const nextMul = bus.activeDucks.reduce((m, d) => Math.min(m, d.mul), 1);
        bus.duckMul = nextMul;
        // 無任何 active duck 時強制把 gain 寫回 userGain，消除任何殘餘
        if (bus.activeDucks.length === 0) {
          bus.input.gain.cancelScheduledValues(t);
          bus.input.gain.setValueAtTime(bus.userGain, t);
        }
      },
      Math.ceil(spec.durationSec * 1000) + 80,
    );
  }

  private hitCooldown(key: AudioEventKey, def: AudioEventDef): boolean {
    const cd = def.cooldownMs ?? 0;
    if (cd <= 0) return false;
    const now = performance.now();
    const last = this.lastEmitAt.get(key) ?? 0;
    if (now - last < cd) return true;
    this.lastEmitAt.set(key, now);
    return false;
  }

  /** 觸發一次事件。for-loop 事件若已在播放會被忽略（改用 startLoop/stopLoop）。 */
  async emit<K extends AudioEventKey>(
    key: K,
    params?: AudioEventParamsMap[K] extends void ? undefined : AudioEventParamsMap[K],
  ): Promise<void> {
    const def = AUDIO_EVENT_CATALOG[key] as AudioEventDef | undefined;
    if (!def) return;
    if (def.loop) {
      await this.startLoop(key);
      return;
    }
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    if (this.hitCooldown(key, def)) return;

    const busNode = this.getBusInput(def.bus);
    if (!busNode) return;

    const synth = await loadSynth(def.synthId);
    if (!synth) return;

    try {
      synth.playOn(ctx, busNode, params as Record<string, unknown> | undefined);
    } catch {
      /* 單顆 synth 故障不能拖垮整個引擎 */
    }

    if (def.duck) {
      for (const d of def.duck) {
        const bus = this.buses.get(d.targetBus);
        if (bus) this.applyDuck(bus, d, ctx);
      }
    }
  }

  async startLoop<K extends AudioEventKey>(key: K): Promise<void> {
    const def = AUDIO_EVENT_CATALOG[key] as AudioEventDef | undefined;
    if (!def || !def.loop) return;
    if (this.loops.has(key)) return;
    if (this.pendingLoopStarts.has(key)) return;
    this.pendingLoopStarts.add(key);
    try {
      const ctx = this.ensureCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          /* ignore */
        }
      }
      const busNode = this.getBusInput(def.bus);
      if (!busNode) return;
      const synth = await loadSynth(def.synthId);
      if (!synth) return;
      const handle = synth.playOn(ctx, busNode);
      if (handle && typeof handle.stop === 'function') {
        this.loops.set(key, { key, stop: handle.stop });
      }
    } finally {
      this.pendingLoopStarts.delete(key);
    }
  }

  stopLoop(key: AudioEventKey, releaseSec = 0.4) {
    const h = this.loops.get(key);
    if (!h) return;
    try {
      h.stop(releaseSec);
    } catch {
      /* ignore */
    }
    this.loops.delete(key);
  }

  /** 明確停止所有循環（切換場景時使用） */
  stopAllLoops(releaseSec = 0.4) {
    for (const key of Array.from(this.loops.keys())) this.stopLoop(key, releaseSec);
  }

  /** 讓外部（例如首次點擊）提前喚醒 ctx，降低第一個事件的延遲 */
  async warmUp(): Promise<void> {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
  }

  /** 診斷用：目前 ctx 狀態 */
  getState(): 'uninitialized' | AudioContextState {
    if (!this.ctx) return 'uninitialized';
    return this.ctx.state;
  }
}

export const AudioEngine = new AudioEngineImpl();

/** 頂層便捷 API；大多呼叫點只需要這個 */
export function emit<K extends AudioEventKey>(
  key: K,
  params?: AudioEventParamsMap[K] extends void ? undefined : AudioEventParamsMap[K],
): void {
  void AudioEngine.emit(key, params);
}
