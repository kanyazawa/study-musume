import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCustomVocabEntries } from './customVocabUtils';
import { saveReviewQuestions } from './reviewUtils';
import { getLocalSaveDataTimestamp, registerCloudSync } from './saveUtils';
import { saveStudySession } from './studyHistoryUtils';
import { saveLastStudyTopic, saveProgressData } from '../data/studyData';

describe('cloud sync triggers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    registerCloudSync(null);
    vi.useRealTimers();
  });

  it('schedules cloud sync when review questions are saved', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const syncFn = vi.fn().mockResolvedValue(undefined);
    registerCloudSync(syncFn);

    saveReviewQuestions([{ id: 'review-1', subject: '英語', questionId: 'q1', questionText: 'apple', correctAnswer: 'りんご' }]);

    expect(getLocalSaveDataTimestamp()).toBe(1700000000000);
    vi.advanceTimersByTime(5000);
    await Promise.resolve();

    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('schedules cloud sync when custom vocab is saved', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const syncFn = vi.fn().mockResolvedValue(undefined);
    registerCloudSync(syncFn);

    saveCustomVocabEntries([{ id: 'custom-1', word: 'apple', meaning: 'りんご', createdAt: 1700000000000 }]);

    expect(getLocalSaveDataTimestamp()).toBe(1700000000000);
    vi.advanceTimersByTime(5000);
    await Promise.resolve();

    expect(syncFn).toHaveBeenCalledTimes(1);
  });

  it('schedules cloud sync when study history or progress changes', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const syncFn = vi.fn().mockResolvedValue(undefined);
    registerCloudSync(syncFn);

    saveStudySession({ subject: '英語', duration: 300, questionsAnswered: 10, correctAnswers: 8 });
    saveProgressData({ english: { vocab: { topic1: true } } });
    saveLastStudyTopic('english', 'vocab', 'topic1', '単語', '英単語', { routePath: '/multiplayer-match?mode=solo' });

    expect(getLocalSaveDataTimestamp()).toBe(1700000000000);
    vi.advanceTimersByTime(5000);
    await Promise.resolve();

    expect(syncFn).toHaveBeenCalledTimes(1);
  });
});
