import type { SynthModule } from '../synthContract';
import { UI_TIMBRE } from './uiTimbre';

const mod: SynthModule = {
  playOn(ctx, bus) {
    const t = ctx.currentTime;
    // transient click：提供俐落起音
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(1600, t);
    click.frequency.exponentialRampToValueAtTime(900, t + 0.012);
    clickGain.gain.setValueAtTime(0, t);
    clickGain.gain.linearRampToValueAtTime(UI_TIMBRE.hover.clickPeak, t + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.018);
    click.connect(clickGain);
    clickGain.connect(bus);
    click.start(t);
    click.stop(t + 0.02);

    // body tone：補一點金屬感尾巴
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(980, t);
    body.frequency.exponentialRampToValueAtTime(760, t + 0.05);
    bodyGain.gain.setValueAtTime(0, t);
    bodyGain.gain.linearRampToValueAtTime(UI_TIMBRE.hover.bodyPeak, t + 0.006);
    bodyGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.062);
    body.connect(bodyGain);
    bodyGain.connect(bus);
    body.start(t);
    body.stop(t + 0.07);
  },
};

export default mod;
