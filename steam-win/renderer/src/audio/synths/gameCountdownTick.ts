import type { SynthModule } from '../synthContract';

const mod: SynthModule = {
  playOn(ctx, bus, params) {
    const remainingSeconds = Math.max(
      0,
      Number((params as { remainingSeconds?: number } | undefined)?.remainingSeconds ?? 0),
    );
    if (remainingSeconds <= 0) return;
    const t = ctx.currentTime;
    const peak = 0.038;
    const urgency = Math.max(0, 11 - Math.min(10, remainingSeconds));
    const freq = 380 + urgency * 42;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.08, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, t + 0.038);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0007, t + 0.07);

    osc.connect(gain);
    gain.connect(bus);
    osc.start(t);
    osc.stop(t + 0.08);
  },
};

export default mod;
