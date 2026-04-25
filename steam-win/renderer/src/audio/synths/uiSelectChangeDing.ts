import type { SynthModule } from '../synthContract';

/**
 * 切換選擇專用「叮、叮」。
 * 金屬感短雙擊：第一顆定調、第二顆更亮更短。
 */
const mod: SynthModule = {
  playOn(ctx, bus) {
    const t = ctx.currentTime;

    const playDing = (
      startAt: number,
      f0: number,
      f1: number,
      peak: number,
      dur: number,
      hpCutHz: number,
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = hpCutHz;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f0 * 1.1;
      bp.Q.value = 1.45;
      // square + bandpass 讓金屬感更明顯
      osc.type = 'square';
      osc.frequency.setValueAtTime(f0, startAt);
      osc.frequency.exponentialRampToValueAtTime(f1, startAt + dur * 0.9);
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(peak, startAt + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0008, startAt + dur);
      osc.connect(bp);
      bp.connect(hp);
      hp.connect(gain);
      gain.connect(bus);
      osc.start(startAt);
      osc.stop(startAt + dur + 0.01);
    };

    // 第 1 顆：主提示
    playDing(t, 1540, 1310, 0.028, 0.078, 320);

    // 第 2 顆：更亮更短
    const t2 = t + 0.064;
    playDing(t2, 1980, 1680, 0.022, 0.052, 520);

    // 第二顆附加一點 shimmer（很小聲，不刺耳）
    const sh = ctx.createOscillator();
    const shGain = ctx.createGain();
    sh.type = 'sine';
    sh.frequency.setValueAtTime(3600, t2);
    sh.frequency.exponentialRampToValueAtTime(2900, t2 + 0.038);
    shGain.gain.setValueAtTime(0, t2);
    shGain.gain.linearRampToValueAtTime(0.006, t2 + 0.003);
    shGain.gain.exponentialRampToValueAtTime(0.0008, t2 + 0.041);
    sh.connect(shGain);
    shGain.connect(bus);
    sh.start(t2);
    sh.stop(t2 + 0.045);
  },
};

export default mod;

