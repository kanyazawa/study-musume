import { describe, expect, it } from 'vitest';
import {
  getDefaultCalendarState,
  getDefaultPromiseState,
  getDefaultRouteState,
  normalizeStoryProgressionStats,
} from './storyProgressionUtils';

describe('storyProgressionUtils', () => {
  it('fills in default progression state for missing values', () => {
    expect(normalizeStoryProgressionStats({})).toEqual({
      calendarState: getDefaultCalendarState(),
      routeState: getDefaultRouteState(),
      promiseState: getDefaultPromiseState(),
    });
  });

  it('sanitizes malformed progression state', () => {
    const normalized = normalizeStoryProgressionStats({
      calendarState: {
        day: -8,
        weekday: 'holiday',
        month: 18,
        season: 'rainy',
        term: 'festival',
        timeSlot: 'lateNight',
        loopCount: 0,
        lastAdvancedAt: 'bad',
      },
      routeState: {
        status: 'route',
        characterId: 123,
        pendingCharacterId: ' noah ',
        lockSourceEventId: 99,
        endingId: null,
        lastUpdatedAt: 'oops',
      },
      promiseState: {
        activePromises: [
          null,
          {
            id: 'promise-01',
            title: '図書室へ行く',
            characterId: 'noah',
            dateKey: '2026-05-12',
            timeSlot: 'lateNight',
            locationId: 'library',
            eventId: 'noah_library_01',
            status: 'ready',
            createdAt: 'x',
            resolvedAt: 1700000000000,
          },
          {
            id: '',
            title: 'missing id',
          },
        ],
        completedPromiseIds: ['promise-02', '', 'promise-02'],
        brokenPromiseIds: ['promise-03', 4],
        lastResolvedAt: 'later',
      },
    });

    expect(normalized).toEqual({
      calendarState: {
        day: 1,
        weekday: 'mon',
        month: 12,
        season: 'spring',
        term: 'opening',
        timeSlot: 'morning',
        loopCount: 1,
        lastAdvancedAt: null,
      },
      routeState: {
        status: 'common',
        characterId: null,
        pendingCharacterId: 'noah',
        lockSourceEventId: '',
        endingId: '',
        lastUpdatedAt: null,
      },
      promiseState: {
        activePromises: [
          {
            id: 'promise-01',
            title: '図書室へ行く',
            characterId: 'noah',
            dateKey: '2026-05-12',
            timeSlot: 'afterSchool',
            locationId: 'library',
            eventId: 'noah_library_01',
            status: 'scheduled',
            createdAt: null,
            resolvedAt: 1700000000000,
          },
        ],
        completedPromiseIds: ['promise-02'],
        brokenPromiseIds: ['promise-03'],
        lastResolvedAt: null,
      },
    });
  });
});
