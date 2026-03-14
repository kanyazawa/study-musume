import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  collectAllSaveData,
  getDefaultStats,
  loadStats,
  registerCloudSync,
  restoreAllSaveData,
  saveStats,
} from './saveUtils';

describe('saveUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    registerCloudSync(null);
    vi.useRealTimers();
  });

  it('returns default stats when no save data exists', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const stats = loadStats();

    expect(stats).toEqual(getDefaultStats());
  });

  it('grants the welcome bonus once for legacy save data', () => {
    localStorage.setItem(
      'gameStats',
      JSON.stringify({
        diamonds: 500,
        hasReceivedWelcomeBonus: false,
      }),
    );

    const stats = loadStats();

    expect(stats.diamonds).toBe(3500);
    expect(stats.hasReceivedWelcomeBonus).toBe(true);
    expect(JSON.parse(localStorage.getItem('gameStats')).diamonds).toBe(3500);
  });

  it('collects and restores synchronized save data', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    localStorage.setItem('gameStats', '{"tp":42}');
    localStorage.setItem('studyHistory', '["math"]');

    const snapshot = collectAllSaveData();

    localStorage.clear();
    restoreAllSaveData(snapshot);

    expect(snapshot._savedAt).toBe(1700000000000);
    expect(localStorage.getItem('gameStats')).toBe('{"tp":42}');
    expect(localStorage.getItem('studyHistory')).toBe('["math"]');
  });

  it('triggers cloud sync after the debounce window', async () => {
    vi.useFakeTimers();
    const syncFn = vi.fn().mockResolvedValue(undefined);
    registerCloudSync(syncFn);

    saveStats({ tp: 50 });
    vi.advanceTimersByTime(4999);
    expect(syncFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    await Promise.resolve();

    expect(syncFn).toHaveBeenCalledTimes(1);
  });
});
