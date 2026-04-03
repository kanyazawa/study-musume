import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getHomeReviewSummary,
  getRecommendedReviewQuestion,
  saveReviewQuestions,
} from './reviewUtils';

describe('reviewUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-11-14T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty home summary when no review questions exist', () => {
    const summary = getHomeReviewSummary();

    expect(summary.hasReviews).toBe(false);
    expect(summary.mode).toBe('empty');
    expect(summary.ctaLabel).toBe('授業へ');
    expect(summary.reviewTicketsRemaining).toBe(3);
  });

  it('recommends the most urgent review question for the home card', () => {
    saveReviewQuestions([
      {
        id: 'math-later',
        subject: '数学',
        questionId: 'q1',
        questionText: '二次関数の最大値を求める',
        correctAnswer: '4',
        wrongCount: 1,
        reviewLevel: 2,
        nextReviewDate: Date.now() + 3 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'eng-due',
        subject: '英語',
        questionId: 'q2',
        questionText: '関係代名詞 that の用法を選ぶ',
        correctAnswer: '主格',
        wrongCount: 3,
        reviewLevel: 0,
        nextReviewDate: Date.now() - 60 * 60 * 1000,
      },
    ]);

    const recommended = getRecommendedReviewQuestion();
    const summary = getHomeReviewSummary({
      reviewRewardDate: '2023-11-14',
      reviewSetsToday: 1,
      reviewTicketsRemaining: 2,
    });

    expect(recommended?.id).toBe('eng-due');
    expect(summary.mode).toBe('due');
    expect(summary.due).toBe(1);
    expect(summary.priorityLabel).toBe('今すぐ');
    expect(summary.recommendedMeta).toContain('英語');
    expect(summary.reviewSetsToday).toBe(1);
    expect(summary.reviewTicketsRemaining).toBe(2);
    expect(summary.bonusHints.some((hint) => hint.includes('あと1セット'))).toBe(true);
  });

  it('highlights upcoming reviews when nothing is overdue', () => {
    saveReviewQuestions([
      {
        id: 'chem-soon',
        subject: '化学',
        questionId: 'q3',
        questionText: '中和反応のイオン式を答える',
        correctAnswer: 'H+ + OH- -> H2O',
        wrongCount: 2,
        reviewLevel: 1,
        nextReviewDate: Date.now() + 24 * 60 * 60 * 1000,
      },
    ]);

    const summary = getHomeReviewSummary({
      reviewRewardDate: '2023-11-14',
      reviewSetsToday: 2,
      reviewTicketsRemaining: 1,
    });

    expect(summary.mode).toBe('soon');
    expect(summary.soonCount).toBe(1);
    expect(summary.ctaLabel).toBe('1問だけ先回り');
    expect(summary.bonusHints.some((hint) => hint.includes('次のセットで'))).toBe(true);
  });
});
