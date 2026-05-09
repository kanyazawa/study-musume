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
    expect(stats.calendarState).toEqual({
      day: 1,
      weekday: 'mon',
      month: 4,
      season: 'spring',
      term: 'opening',
      timeSlot: 'morning',
      loopCount: 1,
      lastAdvancedAt: null,
    });
    expect(stats.routeState).toEqual({
      status: 'common',
      characterId: null,
      pendingCharacterId: null,
      lockSourceEventId: '',
      endingId: '',
      lastUpdatedAt: null,
    });
    expect(stats.promiseState).toEqual({
      activePromises: [],
      completedPromiseIds: [],
      brokenPromiseIds: [],
      lastResolvedAt: null,
    });
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

  it('normalizes story progression state for legacy saves', () => {
    localStorage.setItem(
      'gameStats',
      JSON.stringify({
        calendarState: {
          day: 0,
          weekday: 'holiday',
          timeSlot: 'lateNight',
        },
        routeState: {
          status: 'locked',
          characterId: 'noah',
        },
        promiseState: {
          activePromises: [
            {
              id: 'promise-01',
              title: '図書室',
              timeSlot: 'night',
            },
          ],
          completedPromiseIds: ['promise-02', '', 'promise-02'],
        },
      }),
    );

    const stats = loadStats();

    expect(stats.calendarState).toEqual({
      day: 1,
      weekday: 'mon',
      month: 4,
      season: 'spring',
      term: 'opening',
      timeSlot: 'morning',
      loopCount: 1,
      lastAdvancedAt: null,
    });
    expect(stats.routeState).toEqual({
      status: 'locked',
      characterId: 'noah',
      pendingCharacterId: null,
      lockSourceEventId: '',
      endingId: '',
      lastUpdatedAt: null,
    });
    expect(stats.promiseState).toEqual({
      activePromises: [
        {
          id: 'promise-01',
          title: '図書室',
          characterId: null,
          dateKey: '',
          timeSlot: 'night',
          locationId: '',
          eventId: '',
          status: 'scheduled',
          createdAt: null,
          resolvedAt: null,
        },
      ],
      completedPromiseIds: ['promise-02'],
      brokenPromiseIds: [],
      lastResolvedAt: null,
    });
  });
});
