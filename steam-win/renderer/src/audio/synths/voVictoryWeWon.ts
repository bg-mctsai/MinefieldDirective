import voUrl from '../../assets/audio/vo_combat_victory_we_won.mp3';
import type { SynthModule, SynthStopHandle } from '../synthContract';

const decodedByCtx = new WeakMap<AudioContext, Promise<AudioBuffer>>();

function getDecodedBuffer(ctx: AudioContext): Promise<AudioBuffer> {
  const cached = decodedByCtx.get(ctx);
  if (cached) return cached;
  const p = fetch(voUrl)
    .then((r) => r.arrayBuffer())
    .then((ab) => ctx.decodeAudioData(ab.slice(0)));
  decodedByCtx.set(ctx, p);
  return p;
}

/** 戰場過關：「哈……太棒了！我們贏啦！！幹得好，兄弟們。」（已裁切呼……哈哈！） */
const mod: SynthModule = {
  playOn(ctx, bus): SynthStopHandle {
    const t0 = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(0.9, t0 + 0.04);
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
      stop(releaseSec = 0.12) {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime;
        const fade = Math.max(0.04, releaseSec);
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.linearRampToValueAtTime(0, now + fade);
        const stopAt = now + fade + 0.03;
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
