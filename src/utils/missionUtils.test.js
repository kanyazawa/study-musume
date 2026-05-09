import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadMissions, resetMissions, updateMissionsOnWriteDailyNote } from './missionUtils';

describe('missionUtils daily note mission', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T09:00:00'));
    resetMissions();
  });

  it('completes the daily note mission after writing one memo', () => {
    updateMissionsOnWriteDailyNote();

    const missions = loadMissions();

    expect(missions.daily_note).toMatchObject({
      current: 1,
      completed: true,
      claimed: false,
    });
  });

  it('does not increase the daily note mission beyond its target', () => {
    updateMissionsOnWriteDailyNote();
    updateMissionsOnWriteDailyNote();

    const missions = loadMissions();

    expect(missions.daily_note.current).toBe(1);
    expect(missions.daily_note.completed).toBe(true);
  });
});
