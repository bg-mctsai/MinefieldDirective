import type { SynthModule } from '../synthContract';

const mod: SynthModule = {
  playOn(ctx, bus, params) {
    const raw = Number((params as { value?: number } | undefined)?.value ?? 0);
    const v = Math.min(9, Math.max(0, Math.floor(raw)));
    const t = ctx.currentTime;
    const peak = 0.042;
    const f = 420 + v * 38;

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc2.type = 'sine';
    osc.frequency.setValueAtTime(f * 1.12, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.09);
    osc2.frequency.setValueAtTime(f * 2.02, t);
    osc2.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.05);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.1);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(bus);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.11);
    osc2.stop(t + 0.08);
  },
};

export default mod;
