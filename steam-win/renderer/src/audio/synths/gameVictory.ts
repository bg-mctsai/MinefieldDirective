import victoryUrl from '../../assets/audio/Glory_s_Edge_victory_10s.mp3';
import type { SynthModule, SynthStopHandle } from '../synthContract';

const decodedByCtx = new WeakMap<AudioContext, Promise<AudioBuffer>>();

function getDecodedBuffer(ctx: AudioContext): Promise<AudioBuffer> {
  const cached = decodedByCtx.get(ctx);
  if (cached) return cached;
  const p = fetch(victoryUrl)
    .then((r) => r.arrayBuffer())
    .then((ab) => ctx.decodeAudioData(ab.slice(0)));
  decodedByCtx.set(ctx, p);
  return p;
}

/** 過關凱旋：Glory's Edge 尾段 10s（15:00–25:00，含淡入淡出） */
const mod: SynthModule = {
  playOn(ctx, bus): SynthStopHandle {
    const t0 = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(0.11, t0 + 0.5);
    out.connect(bus);

    let source: AudioBufferSourceNode | null = null;
    let stopped = false;

    void getDecodedBuffer(ctx).then((buffer) => {
      if (stopped) return;
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(out);
      source.start();
    });

    return {
      stop(releaseSec = 0.35) {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime;
        const fade = Math.max(0.05, releaseSec);
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.linearRampToValueAtTime(0, now + fade);
        const stopAt = now + fade + 0.05;
        try {
          source?.stop(stopAt);
        } catch {
          /* ignore */
        }
      },
    };
  },
};

export default mod;
