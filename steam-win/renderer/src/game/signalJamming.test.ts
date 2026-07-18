import { describe, expect, it } from 'vitest';
import {
  effectiveSignalJammingStepMs,
  signalJammingDisplayedDigit,
} from './signalJamming';

describe('signalJammingDisplayedDigit', () => {
  it('same inputs always yield the same digit (lock must match display formula)', () => {
    const epoch = 1_700_000_000_000;
    const now = epoch + 12_345;
    const a = signalJammingDisplayedDigit(epoch, 2, now, 200, 'SQUARE', 'xiaoming');
    const b = signalJammingDisplayedDigit(epoch, 2, now, 200, 'SQUARE', 'xiaoming');
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(1);
    expect(a).toBeLessThanOrEqual(8);
  });

  it('hex never shows 7 or 8', () => {
    const epoch = 1_700_000_000_000;
    for (let t = 0; t < 500; t++) {
      for (let slot = 0; slot < 5; slot++) {
        const d = signalJammingDisplayedDigit(epoch, slot, epoch + t * 17, 120, 'HEXAGON', 'ada');
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(6);
      }
    }
  });

  it('ada doubles step vs default hero', () => {
    expect(effectiveSignalJammingStepMs(200, 'ada')).toBe(400);
    expect(effectiveSignalJammingStepMs(200, 'xiaoming')).toBe(200);
  });
});
