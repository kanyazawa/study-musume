import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  collectAllSaveData,
  getLocalSaveDataTimestamp,
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
    expect(stats.selectedHeroineId).toBeNull();
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
    localStorage.setItem('gameStats', '{"tp":42,"affection":77,"favoriteCharacter":"noah","ownedItems":["pen"]}');
    localStorage.setItem('studyHistory', '["math"]');

    const snapshot = collectAllSaveData();

    localStorage.clear();
    restoreAllSaveData(snapshot);

    expect(snapshot._savedAt).toBe(1700000000000);
    expect(getLocalSaveDataTimestamp()).toBe(1700000000000);
    expect(localStorage.getItem('gameStats')).toBe('{"tp":42,"affection":77,"favoriteCharacter":"noah","ownedItems":["pen"]}');
    expect(localStorage.getItem('studyHistory')).toBe('["math"]');
    expect(localStorage.getItem('affection')).toBe('77');
    expect(localStorage.getItem('favoriteCharacter')).toBe('noah');
    expect(localStorage.getItem('ownedItems')).toBe('["pen"]');
  });

  it('reuses the persisted save timestamp instead of refreshing it during sync reads', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    saveStats({ tp: 50 });

    expect(getLocalSaveDataTimestamp()).toBe(1700000000000);

    vi.spyOn(Date, 'now').mockReturnValue(1800000000000);

    const snapshot = collectAllSaveData({ initializeTimestamp: false });

    expect(snapshot._savedAt).toBe(1700000000000);
    expect(getLocalSaveDataTimestamp()).toBe(1700000000000);
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

  it('restores selectedHeroineId from legacy favoriteCharacter when needed', () => {
    localStorage.setItem(
      'gameStats',
      JSON.stringify({
        favoriteCharacter: 'ren',
      }),
    );

    const stats = loadStats();

    expect(stats.selectedHeroineId).toBe('ren');
    expect(stats.favoriteCharacter).toBe('ren');
  });

  it('saves selectedHeroineId and favoriteCharacter in sync', () => {
    saveStats({
      characterId: 'emma',
      selectedHeroineId: 'emma',
      favoriteCharacter: 'noah',
    });

    const parsed = JSON.parse(localStorage.getItem('gameStats'));

    expect(parsed.selectedHeroineId).toBe('emma');
    expect(parsed.favoriteCharacter).toBe('emma');
  });
});
