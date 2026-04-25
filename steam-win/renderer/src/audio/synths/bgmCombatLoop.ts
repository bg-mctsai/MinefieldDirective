import type { SynthModule, SynthStopHandle } from '../synthContract';

/**
 * 對局戰鬥循環：低頻 pulse + 帶通雜訊 shimmer，強調節奏壓力。
 * 不做 beat 音序，只靠 LFO 與濾波提供「緊張氛圍」，避免與 SFX 打架。
 */
const mod: SynthModule = {
  isLoop: true,
  playOn(ctx, bus): SynthStopHandle {
    const t0 = ctx.currentTime;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(0.06, t0 + 0.8);
    out.connect(bus);

    // pulse: 方波 + LFO 調變 gain，模擬心跳
    const pulse = ctx.createOscillator();
    pulse.type = 'square';
    pulse.frequency.value = 62;
    const pulseGain = ctx.createGain();
    pulseGain.gain.value = 0.05;
    const pulseLp = ctx.createBiquadFilter();
    pulseLp.type = 'lowpass';
    pulseLp.frequency.value = 220;

    pulse.connect(pulseGain);
    pulseGain.connect(pulseLp);
    pulseLp.connect(out);
    pulse.start(t0);

    const pulseLfo = ctx.createOscillator();
    pulseLfo.type = 'sine';
    pulseLfo.frequency.value = 1.25; // ~75 bpm 感
    const pulseLfoGain = ctx.createGain();
    pulseLfoGain.gain.value = 0.04;
    pulseLfo.connect(pulseLfoGain);
    pulseLfoGain.connect(pulseGain.gain);
    pulseLfo.start(t0);

    // shimmer: 白噪過帶通
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 3;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.012;
    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(out);
    noise.start(t0);

    let stopped = false;
    return {
      stop(releaseSec = 0.9) {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.linearRampToValueAtTime(0, now + Math.max(0.05, releaseSec));
        const stopAt = now + Math.max(0.05, releaseSec) + 0.05;
        try {
          pulse.stop(stopAt);
          pulseLfo.stop(stopAt);
          noise.stop(stopAt);
        } catch {
          /* ignore */
        }
      },
    };
  },
};

export default mod;
