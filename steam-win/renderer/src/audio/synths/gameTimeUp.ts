import type { SynthModule } from '../synthContract';

const mod: SynthModule = {
  playOn(ctx, bus) {
    const t = ctx.currentTime;
    const peak = 0.045;

    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const f0 = i === 0 ? 520 : 310;
      osc.frequency.setValueAtTime(f0, t + i * 0.055);
      gain.gain.setValueAtTime(0, t + i * 0.055);
      gain.gain.linearRampToValueAtTime(peak * 0.9, t + i * 0.055 + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0007, t + i * 0.055 + 0.1);
      osc.connect(gain);
      gain.connect(bus);
      osc.start(t + i * 0.055);
      osc.stop(t + i * 0.055 + 0.11);
    }
  },
};

export default mod;
