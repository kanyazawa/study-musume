import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGameLoopSnapshot, getStoredGoalData } from './gameLoopUtils';

describe('gameLoopUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('builds a default loop snapshot without crashing', () => {
    const snapshot = getGameLoopSnapshot({
      multiplayerRating: 1000,
      reviewRewardDate: null,
      reviewSetsToday: 0,
      reviewTicketsRemaining: 3,
    });

    expect(snapshot.recommendedNextAction.routePath).toBe('/study');
    expect(snapshot.battleProgress.levelLabel).toBe('英検5級');
    expect(snapshot.reviewLoad.due).toBe(0);
  });

  it('prioritizes review when due questions exist', () => {
    localStorage.setItem('reviewQuestions', JSON.stringify([
      {
        id: 'eng-due',
        subject: '英語',
        questionId: 'q1',
        questionText: 'apple',
        correctAnswer: 'りんご',
        userAnswer: 'みかん',
        wrongCount: 2,
        reviewLevel: 0,
        nextReviewDate: Date.now() - 1000,
        firstWrongDate: Date.now() - 5000,
        lastWrongDate: Date.now() - 1000,
        reviewHistory: [],
      },
    ]));

    const snapshot = getGameLoopSnapshot({
      multiplayerRating: 1200,
      reviewRewardDate: null,
      reviewSetsToday: 0,
      reviewTicketsRemaining: 3,
    });

    expect(snapshot.reviewLoad.due).toBe(1);
    expect(snapshot.recommendedNextAction.routePath).toBe('/review');
    expect(snapshot.recommendedNextAction.phase).toBe('定着');
  });

  it('reads goal data from local storage safely', () => {
    localStorage.setItem('uma_main_goal', '英検準2級に合格');
    localStorage.setItem('uma_todos', JSON.stringify([
      { id: 1, text: '文法を1章進める', completed: true },
      { id: 2, text: '単語バトルを1回', completed: false },
    ]));

    const goalData = getStoredGoalData();

    expect(goalData.mainGoal).toBe('英検準2級に合格');
    expect(goalData.totalTodoCount).toBe(2);
    expect(goalData.completedTodoCount).toBe(1);
    expect(goalData.todoCompletionPercent).toBe(50);
  });
});
