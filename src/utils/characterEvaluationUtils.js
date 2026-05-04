const DEFAULT_EVALUATION_STATE = {
    score: 0,
    totalSessions: 0,
    lastDelta: 0,
    lastActivityType: '',
    lastOutcome: '',
    lastComment: '',
    lastUpdatedAt: null,
    bestAccuracy: 0,
};

const EVALUATION_TIERS = [
    { minScore: 96, rank: 'SS', label: '放っておけない天才', accent: 'legendary' },
    { minScore: 72, rank: 'S', label: '自慢の生徒', accent: 'excellent' },
    { minScore: 48, rank: 'A', label: 'かなり頼れる', accent: 'strong' },
    { minScore: 28, rank: 'B', label: '見込みあり', accent: 'good' },
    { minScore: 12, rank: 'C', label: 'ちゃんと伸びてる', accent: 'warm' },
    { minScore: -8, rank: 'D', label: 'まだ様子見', accent: 'neutral' },
    { minScore: Number.NEGATIVE_INFINITY, rank: 'E', label: 'ちょっと心配', accent: 'alert' },
];

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

const getActivityBaseDelta = (activityType) => {
    switch (activityType) {
        case 'battle':
            return 3;
        case 'practice':
            return 2;
        case 'study':
        default:
            return 2;
    }
};

const getActivityLabel = (activityType) => {
    switch (activityType) {
        case 'battle':
            return '実戦';
        case 'practice':
            return '演習';
        case 'study':
        default:
            return '授業';
    }
};

const getAccuracyDelta = (accuracy, answeredCount) => {
    if (answeredCount <= 0) {
        return 0;
    }

    if (accuracy >= 100) return 8;
    if (accuracy >= 90) return 6;
    if (accuracy >= 75) return 4;
    if (accuracy >= 60) return 2;
    if (accuracy >= 40) return 0;
    return -2;
};

const buildOutcomeComment = ({ delta, accuracy, answeredCount, activityLabel }) => {
    if (answeredCount <= 0) {
        return 'まだ今回の勉強では判断材料が少ないみたい。';
    }

    if (delta >= 10) {
        return `${activityLabel}の出来がかなり刺さったみたい。完全に見直してる。`;
    }

    if (delta >= 6) {
        return `${activityLabel}の手応えがよくて、かなり評価が上がった。`;
    }

    if (delta >= 2) {
        return `${activityLabel}をちゃんとやり切ったので、安心感が増している。`;
    }

    if (delta > 0) {
        return `${activityLabel}を積み重ねた分だけ、少しずつ印象が良くなっている。`;
    }

    if (accuracy < 40) {
        return `${activityLabel}の結果を見て、少し心配しているみたい。次で挽回したい。`;
    }

    return `${activityLabel}の評価は今回は据え置き。次の一回が大事。`;
};

const getTierForScore = (score = 0) => (
    EVALUATION_TIERS.find((tier) => score >= tier.minScore) || EVALUATION_TIERS[EVALUATION_TIERS.length - 1]
);

const getNextTier = (score = 0) => (
    [...EVALUATION_TIERS]
        .reverse()
        .find((tier) => tier.minScore > score) || null
);

const getRawCharacterEvaluations = (stats = {}) => (
    stats?.characterEvaluations && typeof stats.characterEvaluations === 'object'
        ? stats.characterEvaluations
        : {}
);

export const getCharacterEvaluationState = (stats = {}, characterId = stats?.characterId || 'noah') => ({
    ...DEFAULT_EVALUATION_STATE,
    ...(getRawCharacterEvaluations(stats)[characterId] || {}),
});

export const getCharacterEvaluationSummary = (stats = {}, characterId = stats?.characterId || 'noah') => {
    const state = getCharacterEvaluationState(stats, characterId);
    const score = clampNumber(Number(state.score) || 0, -24, 120);
    const tier = getTierForScore(score);
    const nextTier = getNextTier(score);
    const floor = tier.minScore === Number.NEGATIVE_INFINITY ? -24 : tier.minScore;
    const ceiling = nextTier ? nextTier.minScore : 120;
    const progressPercent = nextTier
        ? Math.round(clampNumber(((score - floor) / Math.max(ceiling - floor, 1)) * 100, 0, 100))
        : 100;

    return {
        ...state,
        score,
        rank: tier.rank,
        label: tier.label,
        accent: tier.accent,
        progressPercent,
        nextRank: nextTier?.rank || null,
        nextLabel: nextTier?.label || 'MAX',
        pointsToNext: nextTier ? Math.max(nextTier.minScore - score, 0) : 0,
    };
};

export const applyCharacterEvaluationResult = (stats = {}, {
    activityType = 'study',
    answeredCount = 0,
    correctCount = 0,
    accuracy,
    completed = true,
    durationMinutes = 0,
    perfect = false,
} = {}) => {
    const characterId = stats?.characterId || 'noah';
    const currentState = getCharacterEvaluationState(stats, characterId);
    const resolvedAnsweredCount = Math.max(0, Number(answeredCount) || 0);
    const resolvedCorrectCount = Math.max(0, Number(correctCount) || 0);
    const resolvedAccuracy = Number.isFinite(Number(accuracy))
        ? clampNumber(Number(accuracy), 0, 100)
        : (resolvedAnsweredCount > 0
            ? Math.round((resolvedCorrectCount / resolvedAnsweredCount) * 100)
            : 0);
    const activityLabel = getActivityLabel(activityType);

    let delta = getActivityBaseDelta(activityType);
    delta += getAccuracyDelta(resolvedAccuracy, resolvedAnsweredCount);

    if (perfect && resolvedAnsweredCount >= 3) {
        delta += 2;
    }

    if (completed && resolvedAnsweredCount >= 5) {
        delta += 1;
    }

    if (Number(durationMinutes) >= 10) {
        delta += 1;
    }

    if (!completed && resolvedAnsweredCount <= 0) {
        delta = 0;
    }

    delta = clampNumber(delta, -4, 12);

    const previousSummary = getCharacterEvaluationSummary(stats, characterId);
    const nextScore = clampNumber(previousSummary.score + delta, -24, 120);
    const nextState = {
        ...currentState,
        score: nextScore,
        totalSessions: (Number(currentState.totalSessions) || 0) + (completed ? 1 : 0),
        lastDelta: delta,
        lastActivityType: activityType,
        lastOutcome: `${activityLabel} ${resolvedAccuracy}%`,
        lastComment: buildOutcomeComment({
            delta,
            accuracy: resolvedAccuracy,
            answeredCount: resolvedAnsweredCount,
            activityLabel,
        }),
        lastUpdatedAt: Date.now(),
        bestAccuracy: Math.max(Number(currentState.bestAccuracy) || 0, resolvedAccuracy),
    };
    const nextStats = {
        ...stats,
        characterEvaluations: {
            ...getRawCharacterEvaluations(stats),
            [characterId]: nextState,
        },
    };
    const nextSummary = getCharacterEvaluationSummary(nextStats, characterId);

    return {
        nextStats,
        previousSummary,
        nextSummary,
        delta,
        activityLabel,
        reactionText: nextState.lastComment,
        hasTierChanged: previousSummary.rank !== nextSummary.rank,
    };
};
