import type { SynthModule } from '../synthContract';

const mod: SynthModule = {
  playOn(ctx, bus) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1020 + Math.random() * 160, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.005, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.00012, t + 0.022);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + 0.024);
  },
};

export default mod;
