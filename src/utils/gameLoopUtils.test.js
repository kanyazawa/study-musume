import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getStoredGoalData } from './goalUtils';
import { getGameLoopSnapshot, mergeGameLoopStats } from './gameLoopUtils';

describe('gameLoopUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const buildStoryProgressSummary = (stats = {}, overrides = {}) => (
    mergeGameLoopStats(
      {
        multiplayerRating: 1000,
        reviewRewardDate: null,
        reviewSetsToday: 0,
        reviewTicketsRemaining: 3,
        ...stats,
      },
      overrides,
    ).storyProgressSummary
  );

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

  it('defaults story progress summary to study-first priority', () => {
    const summary = buildStoryProgressSummary();

    expect(summary).toMatchObject({
      studyPriority: 'study',
    });
  });

  it('switches story progress summary to review priority when due reviews exist', () => {
    const summary = buildStoryProgressSummary({}, {
      reviewSummary: {
        hasReviews: true,
        total: 1,
        due: 2,
        soonCount: 0,
        laterCount: 0,
        reviewSetsToday: 0,
        reviewTicketsRemaining: 3,
        headline: '期限切れあり',
        body: '先に復習したい状態',
        ctaLabel: '復習へ',
      },
    });

    expect(summary).toMatchObject({
      studyPriority: 'review',
    });
  });

  it('keeps class-first guidance even when a promise is featured without due reviews', () => {
    const summary = buildStoryProgressSummary({
      promiseState: {
        activePromises: [
          {
            id: 'promise-01',
            title: '放課後に図書室へ行く約束',
            characterId: 'noah',
            dateKey: '2026-05-12',
            timeSlot: 'afterSchool',
            locationId: 'library',
            eventId: 'noah_library_01',
            status: 'scheduled',
            createdAt: 1700000000000,
            resolvedAt: null,
          },
        ],
      },
    });

    expect(summary?.featuredPromise).toEqual(expect.objectContaining({
      id: 'promise-01',
    }));
    expect(summary).toMatchObject({
      studyPriority: 'study',
    });
    expect(summary.primaryActionHint).toEqual(expect.stringMatching(/授業|学習/));
  });

  it('routes featured promises through review when due reviews exist', () => {
    const summary = buildStoryProgressSummary({
      promiseState: {
        activePromises: [
          {
            id: 'promise-01',
            title: '放課後に図書室へ行く約束',
            characterId: 'noah',
            dateKey: '2026-05-12',
            timeSlot: 'afterSchool',
            locationId: 'library',
            eventId: 'noah_library_01',
            status: 'scheduled',
            createdAt: 1700000000000,
            resolvedAt: null,
          },
        ],
      },
    }, {
      reviewSummary: {
        hasReviews: true,
        total: 2,
        due: 1,
        soonCount: 0,
        laterCount: 1,
        reviewSetsToday: 0,
        reviewTicketsRemaining: 3,
        headline: '期限切れあり',
        body: '先に復習したい状態',
        ctaLabel: '復習へ',
      },
    });

    expect(summary).toMatchObject({
      studyPriority: 'review',
    });
    expect(summary?.featuredPromise).toEqual(expect.objectContaining({
      id: 'promise-01',
      actionRoutePath: '/review',
    }));
  });

  it('does not force Emma labels when an old emma-mvp flag remains on another character', () => {
    const summary = buildStoryProgressSummary({
      tutorialHomeVariant: 'emma-mvp',
      characterId: 'noah',
      selectedHeroineId: 'noah',
      favoriteCharacter: 'noah',
    });

    expect(summary.focusCharacterLabel).toBe('ノア');
    expect(summary.secondaryActionHint).toBe('交流を見る');
  });
});
