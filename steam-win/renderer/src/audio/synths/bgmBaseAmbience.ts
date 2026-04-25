import type { SynthModule, SynthStopHandle } from '../synthContract';

/**
 * 行動基地環境：極低頻 drone + 慢速 LFO 調變 + 稀疏 pad 脈動。
 * 能量低、長時間掛載不疲勞；停止用 release 平滑淡出。
 */
const mod: SynthModule = {
  isLoop: true,
  playOn(ctx, bus): SynthStopHandle {
    const t0 = ctx.currentTime;

    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(0.08, t0 + 1.2);
    out.connect(bus);

    // drone: 低頻三角 + 五度
    const mkDrone = (freq: number, level: number, detuneCents: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = detuneCents;
      g.gain.value = level;
      osc.connect(g);
      g.connect(out);
      osc.start(t0);
      return { osc, g };
    };

    const d1 = mkDrone(55, 0.8, -4);
    const d2 = mkDrone(82.5, 0.45, +3);

    // LFO：微幅調整主 drone 音量，產生呼吸感
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.18;
    lfo.connect(lfoGain);
    lfoGain.connect(d1.g.gain);
    lfo.start(t0);

    // 極低通過濾，避免刺耳
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    lp.Q.value = 0.5;

    // 重連：d1/d2 先進 lp 再進 out
    d1.g.disconnect();
    d2.g.disconnect();
    d1.g.connect(lp);
    d2.g.connect(lp);
    lp.connect(out);

    let stopped = false;
    return {
      stop(releaseSec = 1.2) {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(out.gain.value, now);
        out.gain.linearRampToValueAtTime(0, now + Math.max(0.05, releaseSec));
        const stopAt = now + Math.max(0.05, releaseSec) + 0.05;
        try {
          d1.osc.stop(stopAt);
          d2.osc.stop(stopAt);
          lfo.stop(stopAt);
        } catch {
          /* ignore */
        }
      },
    };
  },
};

export default mod;
