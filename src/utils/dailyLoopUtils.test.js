import { describe, expect, it, vi } from 'vitest';
import {
  DAILY_LOOP_REWARD,
  buildDailyLoopPhasePatch,
  buildDailyLoopRewardPatch,
  getDailyLoopSummary,
  normalizeDailyLoopState,
} from './dailyLoopUtils';

describe('dailyLoopUtils', () => {
  it('resets stale progress while keeping streak metadata', () => {
    const state = normalizeDailyLoopState({
      date: '2026-05-01',
      completedPhases: { study: true, practice: true, battle: false },
      rewardClaimed: false,
      totalClears: 4,
      streak: 2,
      bestStreak: 3,
      lastClaimDate: '2026-05-01',
    }, new Date('2026-05-02T09:00:00'));

    expect(state.date).toBe('2026-05-02');
    expect(state.completedPhases).toEqual({ study: false, practice: false, battle: false });
    expect(state.totalClears).toBe(4);
    expect(state.streak).toBe(2);
  });

  it('marks a phase complete only once', () => {
    const firstPatch = buildDailyLoopPhasePatch({}, 'study', new Date('2026-05-02T10:00:00'));
    const secondPatch = buildDailyLoopPhasePatch({ dailyLoopState: firstPatch.dailyLoopState }, 'study', new Date('2026-05-02T10:05:00'));

    expect(firstPatch.dailyLoopState.completedPhases.study).toBe(true);
    expect(secondPatch).toBeNull();
  });

  it('builds a reward patch after all phases are complete', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1777777777000);

    const patch = buildDailyLoopRewardPatch({
      tp: 40,
      maxTp: 100,
      diamonds: 100,
      intellect: 50,
      affection: 7,
      dailyLoopState: {
        date: '2026-05-02',
        completedPhases: { study: true, practice: true, battle: true },
        rewardClaimed: false,
        totalClears: 2,
        streak: 1,
        bestStreak: 1,
        lastClaimDate: '2026-05-01',
      },
    }, new Date('2026-05-02T21:00:00'));

    expect(patch).toMatchObject({
      diamonds: 100 + DAILY_LOOP_REWARD.diamonds,
      intellect: 50 + DAILY_LOOP_REWARD.intellect,
      affection: 7 + DAILY_LOOP_REWARD.affection,
      tp: 40 + DAILY_LOOP_REWARD.tp,
    });
    expect(patch.dailyLoopState.rewardClaimed).toBe(true);
    expect(patch.dailyLoopState.totalClears).toBe(3);
    expect(patch.dailyLoopState.streak).toBe(2);
  });

  it('summarizes the next phase and claim state', () => {
    const summary = getDailyLoopSummary({
      dailyLoopState: {
        date: '2026-05-02',
        completedPhases: { study: true, practice: false, battle: false },
        rewardClaimed: false,
        totalClears: 0,
        streak: 0,
        bestStreak: 0,
        lastClaimDate: '',
      },
    }, new Date('2026-05-02T12:00:00'));

    expect(summary.completedCount).toBe(1);
    expect(summary.nextPhase?.id).toBe('practice');
    expect(summary.actionType).toBe('navigate');
    expect(summary.actionRoutePath).toBe('/study');
  });
});
