import { describe, expect, it, vi } from 'vitest';
import {
  calculateTpRecovery,
  getTimeUntilNextRecovery,
  TP_RECOVERY_CONFIG,
  updateTpWithRecovery,
} from './tpRecoveryUtils';

describe('tpRecoveryUtils', () => {
  it('calculates recovery based on elapsed intervals', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000900000);

    const recovery = calculateTpRecovery({
      tp: 10,
      maxTp: 100,
      lastTpUpdateTime: 1700000000000,
    });

    expect(recovery).toEqual({
      recoveredTp: 3,
      newTp: 13,
      newUpdateTime: 1700000900000,
    });
  });

  it('caps recovery at max tp and only advances consumed intervals', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700001200000);

    const recovery = calculateTpRecovery({
      tp: 99,
      maxTp: 100,
      lastTpUpdateTime: 1700000000000,
    });

    expect(recovery).toEqual({
      recoveredTp: 1,
      newTp: 100,
      newUpdateTime: 1700000300000,
    });
  });

  it('returns null when no tp recovery is available', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000100000);

    expect(
      updateTpWithRecovery({
        tp: 10,
        maxTp: 100,
        lastTpUpdateTime: 1700000000000,
      }),
    ).toBeNull();
  });

  it('reports the remaining time until the next recovery tick', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000120000);

    const remaining = getTimeUntilNextRecovery({
      lastTpUpdateTime: 1700000000000,
    });

    expect(remaining).toBe(TP_RECOVERY_CONFIG.intervalMs - 120000);
  });
});
