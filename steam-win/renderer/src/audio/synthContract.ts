/**
 * 所有 `audio/synths/*` 必須匯出符合 `SynthModule` 的介面。
 * 一次性事件與循環事件共用；循環事件另回傳 `stop()` handle。
 */

export type SynthPlayParams = Record<string, unknown> | undefined;

export type SynthStopHandle = {
  /** 平滑停止（含 release 淡出） */
  stop: (releaseSec?: number) => void;
};

export type SynthModule = {
  /**
   * 觸發一次合成。`busNode` 是 engine 提供的 bus 輸入節點，
   * synth 需把自己所有 node 都 connect 到 busNode，完全不可直接接 destination。
   */
  playOn: (
    ctx: AudioContext,
    busNode: AudioNode,
    params?: SynthPlayParams,
  ) => SynthStopHandle | void;

  /** 標記是否為循環合成（BGM）。engine 用此判斷是否長駐。 */
  isLoop?: boolean;
};
