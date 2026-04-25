import homeBgmUrl from '../../assets/audio/The_Third_Wire.mp3';
import type { SynthModule, SynthStopHandle } from '../synthContract';

const decodedByCtx = new WeakMap<AudioContext, Promise<AudioBuffer>>();

function getDecodedBuffer(ctx: AudioContext): Promise<AudioBuffer> {
  const cached = decodedByCtx.get(ctx);
  if (cached) return cached;
  const p = fetch(homeBgmUrl)
    .then((r) => r.arrayBuffer())
    .then((ab) => ctx.decodeAudioData(ab.slice(0)));
  decodedByCtx.set(ctx, p);
  return p;
}

const mod: SynthModule = {
  isLoop: true,
  playOn(ctx, bus): SynthStopHandle {
    const t0 = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(0.2, t0 + 0.8);
    out.connect(bus);

    let source: AudioBufferSourceNode | null = null;
    let stopped = false;

    void getDecodedBuffer(ctx).then((buffer) => {
      if (stopped) return;
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(out);
      source.start();
    });

    return {
      stop(releaseSec = 0.8) {
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
