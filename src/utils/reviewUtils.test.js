import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatNextCorrectReviewProgress,
  formatRelativeDate,
  formatReviewInterval,
  formatReviewProgress,
  formatWrongReviewProgress,
  getHomeReviewSummary,
  getRecommendedReviewQuestion,
  getReviewQuestions,
  getReviewScheduleChoices,
  saveReviewQuestions,
  updateReviewResult,
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

  it('allows choosing a manual next review date without graduating the card', () => {
    const customNextReviewDate = Date.now() + 14 * 24 * 60 * 60 * 1000;

    saveReviewQuestions([
      {
        id: 'eng-manual',
        subject: '英語',
        questionId: 'q4',
        questionText: '熟語の意味を答える',
        correctAnswer: 'give up',
        wrongCount: 2,
        reviewLevel: 4,
        nextReviewDate: Date.now() - 10 * 60 * 1000,
      },
    ]);

    updateReviewResult('eng-manual', true, {
      nextReviewDate: customNextReviewDate,
      reviewLevel: 4,
    });

    const updated = getReviewQuestions();

    expect(updated).toHaveLength(1);
    expect(updated[0].nextReviewDate).toBe(customNextReviewDate);
    expect(updated[0].reviewLevel).toBe(4);
  });

  it('automatically extends the next review interval after a correct answer', () => {
    saveReviewQuestions([
      {
        id: 'eng-auto-correct',
        subject: '英語',
        questionId: 'q-auto-1',
        questionText: '単語の意味を答える',
        correctAnswer: 'improve',
        wrongCount: 1,
        reviewLevel: 1,
        nextReviewDate: Date.now() - 10 * 60 * 1000,
      },
    ]);

    updateReviewResult('eng-auto-correct', true);

    const [updated] = getReviewQuestions();

    expect(updated.reviewLevel).toBe(2);
    expect(updated.nextReviewDate).toBe(Date.now() + 7 * 24 * 60 * 60 * 1000);
    expect(updated.reviewHistory.at(-1)).toEqual({
      date: Date.now(),
      result: 'correct',
    });
  });

  it('resets the review level after a wrong answer', () => {
    saveReviewQuestions([
      {
        id: 'eng-auto-wrong',
        subject: '英語',
        questionId: 'q-auto-2',
        questionText: '単語の意味を答える',
        correctAnswer: 'restore',
        wrongCount: 2,
        reviewLevel: 3,
        nextReviewDate: Date.now() - 10 * 60 * 1000,
      },
    ]);

    updateReviewResult('eng-auto-wrong', false);

    const [updated] = getReviewQuestions();

    expect(updated.reviewLevel).toBe(0);
    expect(updated.nextReviewDate).toBe(Date.now() + 24 * 60 * 60 * 1000);
    expect(updated.reviewHistory.at(-1)).toEqual({
      date: Date.now(),
      result: 'wrong',
    });
  });

  it('offers a graduate option for high-level correct answers', () => {
    const [question] = [
      {
        id: 'math-mastery',
        subject: '数学',
        questionId: 'q5',
        questionText: '極限を求める',
        correctAnswer: '2',
        wrongCount: 1,
        reviewLevel: 4,
        nextReviewDate: Date.now(),
      },
    ];

    const choices = getReviewScheduleChoices(question, true);

    expect(choices.some((choice) => choice.complete && choice.label === '卒業')).toBe(true);
  });

  it('formats short review delays in minutes', () => {
    expect(formatRelativeDate(Date.now() + 10 * 60 * 1000)).toBe('10分後');
    expect(formatRelativeDate(Date.now() - 45 * 60 * 1000)).toBe('45分前');
  });

  it('formats review spacing as user-facing progress labels', () => {
    expect(formatReviewInterval(0)).toBe('1日間隔');
    expect(formatReviewInterval(2)).toBe('7日間隔');
    expect(formatReviewProgress(1)).toBe('今は3日間隔');
    expect(formatNextCorrectReviewProgress(1)).toBe('正解で7日間隔');
    expect(formatNextCorrectReviewProgress(4)).toBe('正解で完全習得');
    expect(formatWrongReviewProgress()).toBe('ミスで1日間隔に戻る');
  });
});
