import { getLastStudyTopic } from '../data/studyData';
import { getDailyLoopSummary } from './dailyLoopUtils';
import { getStoredGoalData } from './goalUtils';
import { DEFAULT_RATING, getLevelFromRating, getNextLevelInfo, getRankFromRating } from './ratingUtils';
import { getHomeReviewSummary } from './reviewUtils';
import { normalizeStoryProgressionStats } from './storyProgressionUtils';

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

export const getDaysUntilExam = (examDate) => {
    if (!examDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(`${examDate}T00:00:00`);
    if (Number.isNaN(target.getTime())) {
        return null;
    }

    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getBattleProgressSummary = (stats = {}) => {
    const rating = Math.max(0, Number(stats?.multiplayerRating) || DEFAULT_RATING);
    const rankInfo = getRankFromRating(rating);
    const levelInfo = getLevelFromRating(rating);
    const nextLevelInfo = getNextLevelInfo(rating);
    const currentFloor = levelInfo.minRating || 0;
    const nextThreshold = nextLevelInfo.nextLevel?.minRating || (currentFloor + 400);
    const ratingWindow = Math.max(nextThreshold - currentFloor, 1);
    const progressPercent = Math.round(
        clampNumber(((rating - currentFloor) / ratingWindow) * 100, 0, 100),
    );

    return {
        rating,
        rank: rankInfo.rank,
        rankIcon: rankInfo.icon,
        level: levelInfo.level,
        levelLabel: levelInfo.label,
        levelEmoji: levelInfo.emoji,
        nextLevelLabel: nextLevelInfo.nextLevel?.label || 'MAX',
        remainingToNext: nextLevelInfo.remaining,
        progressPercent,
        headline: nextLevelInfo.nextLevel
            ? `${nextLevelInfo.nextLevel.label}まであと ${nextLevelInfo.remaining}`
            : '最高レベル帯に到達',
        summary: `${rankInfo.icon} ${rankInfo.rank} / ${levelInfo.label}`,
    };
};

const getReviewLoadSummary = (reviewSummary) => {
    if (!reviewSummary?.hasReviews) {
        return {
            total: 0,
            due: 0,
            soonCount: 0,
            laterCount: 0,
            reviewSetsToday: reviewSummary?.reviewSetsToday || 0,
            reviewTicketsRemaining: reviewSummary?.reviewTicketsRemaining || 0,
            status: 'clear',
            burdenPercent: 0,
            headline: '弱点ノートは空',
            summary: '次は新しい授業か実戦へ進める状態です。',
        };
    }

    const burdenBase = Math.max(reviewSummary.total, 6);
    const burdenScore = (reviewSummary.due * 1.6) + reviewSummary.soonCount + (reviewSummary.laterCount * 0.4);
    const burdenPercent = Math.round(clampNumber((burdenScore / burdenBase) * 100, 0, 100));

    let status = 'light';
    if (reviewSummary.due > 0) {
        status = 'due';
    } else if (reviewSummary.soonCount > 0) {
        status = 'soon';
    }

    return {
        total: reviewSummary.total,
        due: reviewSummary.due,
        soonCount: reviewSummary.soonCount,
        laterCount: reviewSummary.laterCount,
        reviewSetsToday: reviewSummary.reviewSetsToday,
        reviewTicketsRemaining: reviewSummary.reviewTicketsRemaining,
        status,
        burdenPercent,
        headline: reviewSummary.headline,
        summary: reviewSummary.body,
    };
};

const getExamProgressSummary = ({
    stats = {},
    reviewSummary,
    goalData,
    battleProgress,
}) => {
    const examDate = String(stats?.examDate || '').trim();
    const daysLeft = getDaysUntilExam(examDate);
    const hasExamDate = examDate.length > 0 && daysLeft !== null;
    const hasMainGoal = goalData.mainGoal.length > 0;
    const todoRatio = goalData.totalTodoCount > 0
        ? goalData.completedTodoCount / goalData.totalTodoCount
        : hasMainGoal
            ? 0.3
            : 0;
    const reviewReadiness = reviewSummary?.hasReviews
        ? clampNumber(
            1 - (((reviewSummary.due * 1.4) + reviewSummary.soonCount + (reviewSummary.laterCount * 0.25)) / Math.max(reviewSummary.total * 1.4, 6)),
            0,
            1,
        )
        : 1;
    const battleReadiness = clampNumber(((battleProgress.rating || DEFAULT_RATING) - DEFAULT_RATING) / 900, 0, 1);
    const readinessPercent = hasExamDate
        ? Math.round(clampNumber(((todoRatio * 0.45) + (reviewReadiness * 0.35) + (battleReadiness * 0.2)) * 100, 0, 100))
        : 0;

    if (!hasExamDate) {
        return {
            examDate: '',
            hasExamDate: false,
            daysLeft: null,
            readinessPercent,
            todoCompletionPercent: goalData.todoCompletionPercent,
            status: 'unset',
            title: '試験日をまだ決めていない',
            summary: hasMainGoal
                ? `最終目標は「${goalData.mainGoal}」。次は日付を置くと、毎日の優先度が決めやすくなります。`
                : '最終目標と試験日を置くと、ホームのおすすめ行動が締まります。',
            countdownLabel: '未設定',
            mainGoal: goalData.mainGoal,
        };
    }

    if (daysLeft < 0) {
        return {
            examDate,
            hasExamDate: true,
            daysLeft,
            readinessPercent,
            todoCompletionPercent: goalData.todoCompletionPercent,
            status: 'overdue',
            title: '試験日を更新しよう',
            summary: '前回の試験日は過去になっています。次の本番日に合わせて目標を更新しましょう。',
            countdownLabel: '終了',
            mainGoal: goalData.mainGoal,
        };
    }

    if (daysLeft === 0) {
        return {
            examDate,
            hasExamDate: true,
            daysLeft,
            readinessPercent,
            todoCompletionPercent: goalData.todoCompletionPercent,
            status: 'today',
            title: '今日は本番',
            summary: '復習の詰め込みより、確認とメンタルの維持を優先しましょう。',
            countdownLabel: '今日',
            mainGoal: goalData.mainGoal,
        };
    }

    const status = daysLeft <= 14 ? 'urgent' : daysLeft <= 45 ? 'focus' : 'steady';
    const title = daysLeft <= 14
        ? `本番まであと ${daysLeft} 日`
        : daysLeft <= 45
            ? `試験攻略フェーズ残り ${daysLeft} 日`
            : `準備期間はあと ${daysLeft} 日`;

    const summary = hasMainGoal
        ? `目標: ${goalData.mainGoal}。復習負債と対戦精度を見ながら、毎日の学習を積み上げる段階です。`
        : '試験日に向けて、授業・復習・実戦の順で毎日のループを回していきましょう。';

    return {
        examDate,
        hasExamDate: true,
        daysLeft,
        readinessPercent,
        todoCompletionPercent: goalData.todoCompletionPercent,
        status,
        title,
        summary,
        countdownLabel: `${daysLeft}日`,
        mainGoal: goalData.mainGoal,
    };
};

const createAction = (id, phase, routePath, label, description, meta = '') => ({
    id,
    phase,
    routePath,
    label,
    description,
    meta,
});

const getRecommendedNextAction = ({
    stats = {},
    reviewSummary,
    lastStudyTopic,
    examProgress,
    battleProgress,
}) => {
    if (reviewSummary?.due > 0) {
        return createAction(
            'review-due',
            '定着',
            '/review',
            '弱点回収に進む',
            `${reviewSummary.due}件の期限切れがあるので、今は対戦より先にノートを軽くする段階です。`,
            reviewSummary.ctaLabel,
        );
    }

    if (!lastStudyTopic?.routePath) {
        return createAction(
            'start-study',
            '学習',
            '/study',
            '次の授業を選ぶ',
            'まず新しい内容を1つ進めて、今日の育成ラインを作りましょう。',
            '新規知識を獲得',
        );
    }

    if (!stats?.examDate && !examProgress.mainGoal) {
        return createAction(
            'set-goal',
            '準備',
            '/goal',
            '試験目標を決める',
            '目標日と最終ゴールを入れておくと、ホームの導線がより意味を持つようになります。',
            '試験攻略の土台',
        );
    }

    if (reviewSummary?.soonCount > 0 && (reviewSummary.reviewSetsToday || 0) === 0) {
        return createAction(
            'review-soon',
            '定着',
            '/review',
            '近日中の弱点を先回り',
            '期限前に少し触っておくと、次の実戦フェーズで崩れにくくなります。',
            `${reviewSummary.soonCount}件スタンバイ`,
        );
    }

    if (lastStudyTopic?.routePath) {
        return createAction(
            'battle-check',
            '実戦',
            '/multiplayer-match',
            '単語バトルで確認する',
            `${lastStudyTopic.resumeLabel || lastStudyTopic.topicName || '直近の学習内容'}を、実戦形式でどこまで使えるか確認しましょう。`,
            `${battleProgress.levelLabel} 帯`,
        );
    }

    return createAction(
        'study-default',
        '学習',
        '/study',
        '授業に戻る',
        '次の知識獲得フェーズへ進みましょう。',
        '',
    );
};

const getDailyGoals = ({
    stats = {},
    reviewSummary,
    lastStudyTopic,
    examProgress,
    battleProgress,
    recommendedNextAction,
}) => {
    const goals = [];
    const pushGoal = (goal) => {
        if (!goal?.routePath || goals.some((item) => item.id === goal.id || item.routePath === goal.routePath)) {
            return;
        }
        goals.push(goal);
    };

    pushGoal(recommendedNextAction);

    if (!stats?.examDate || !examProgress.mainGoal) {
        pushGoal(createAction(
            'goal-setup',
            '準備',
            '/goal',
            '試験プランを整える',
            '試験日、最終目標、やることリストを入れて中長期の軸を固めるフェーズです。',
            examProgress.countdownLabel,
        ));
    }

    if (lastStudyTopic?.routePath) {
        pushGoal(createAction(
            'study-resume',
            '学習',
            lastStudyTopic.routePath,
            '前回の続きを再開',
            `${lastStudyTopic.resumeLabel || lastStudyTopic.topicName || '前回の学習'}から再開して、知識獲得をつなげましょう。`,
            lastStudyTopic.modeLabel || '',
        ));
    } else {
        pushGoal(createAction(
            'study-new',
            '学習',
            '/study',
            '新しい授業に入る',
            'まずは1つ進めて、今日の学習ログと復習候補を作りましょう。',
            '',
        ));
    }

    if (reviewSummary?.hasReviews) {
        pushGoal(createAction(
            'review-stock',
            '定着',
            '/review',
            reviewSummary.due > 0 ? '弱点ノートを軽くする' : '弱点を先回りで触る',
            reviewSummary.body,
            `${reviewSummary.total}件ストック`,
        ));
    }

    pushGoal(createAction(
        'battle-run',
        '実戦',
        '/multiplayer-match',
        '単語バトルで仕上がり確認',
        `現在は ${battleProgress.summary}。知識を実戦で使える形にしていくフェーズです。`,
        battleProgress.headline,
    ));

    return goals.slice(0, 3);
};

export const getEmptyGameLoopState = () => ({
    dailyLoop: getDailyLoopSummary({}),
    examProgress: {
        examDate: '',
        hasExamDate: false,
        daysLeft: null,
        readinessPercent: 0,
        todoCompletionPercent: 0,
        status: 'unset',
        title: '試験日をまだ決めていない',
        summary: '最終目標と試験日を置くと、毎日の学習ループが整理しやすくなります。',
        countdownLabel: '未設定',
        mainGoal: '',
    },
    battleProgress: {
        rating: DEFAULT_RATING,
        rank: getRankFromRating(DEFAULT_RATING).rank,
        rankIcon: getRankFromRating(DEFAULT_RATING).icon,
        level: getLevelFromRating(DEFAULT_RATING).level,
        levelLabel: getLevelFromRating(DEFAULT_RATING).label,
        levelEmoji: getLevelFromRating(DEFAULT_RATING).emoji,
        nextLevelLabel: getNextLevelInfo(DEFAULT_RATING).nextLevel?.label || 'MAX',
        remainingToNext: getNextLevelInfo(DEFAULT_RATING).remaining,
        progressPercent: 0,
        headline: `${getNextLevelInfo(DEFAULT_RATING).nextLevel?.label || '次の帯'}まであと ${getNextLevelInfo(DEFAULT_RATING).remaining}`,
        summary: `${getRankFromRating(DEFAULT_RATING).icon} ${getRankFromRating(DEFAULT_RATING).rank} / ${getLevelFromRating(DEFAULT_RATING).label}`,
    },
    reviewLoad: {
        total: 0,
        due: 0,
        soonCount: 0,
        laterCount: 0,
        reviewSetsToday: 0,
        reviewTicketsRemaining: 0,
        status: 'clear',
        burdenPercent: 0,
        headline: '弱点ノートは空',
        summary: '次は新しい授業か実戦へ進める状態です。',
    },
    dailyGoals: [],
    recommendedNextAction: {
        id: 'study-default',
        phase: '学習',
        routePath: '/study',
        label: '授業へ進む',
        description: 'まずは新しい内容を1つ進めて、今日のループを始めましょう。',
        meta: '',
    },
});

export const getGameLoopSnapshot = (stats = {}, overrides = {}) => {
    const reviewSummary = overrides.reviewSummary || getHomeReviewSummary(stats);
    const lastStudyTopic = overrides.lastStudyTopic === undefined
        ? getLastStudyTopic()
        : overrides.lastStudyTopic;
    const goalData = {
        ...getStoredGoalData(),
        ...(overrides.goalData || {}),
    };
    const battleProgress = getBattleProgressSummary(stats);
    const reviewLoad = getReviewLoadSummary(reviewSummary);
    const dailyLoop = getDailyLoopSummary(stats);
    const examProgress = getExamProgressSummary({
        stats,
        reviewSummary,
        goalData,
        battleProgress,
    });
    const recommendedNextAction = getRecommendedNextAction({
        stats,
        reviewSummary,
        lastStudyTopic,
        examProgress,
        battleProgress,
    });
    const dailyGoals = getDailyGoals({
        stats,
        reviewSummary,
        lastStudyTopic,
        examProgress,
        battleProgress,
        recommendedNextAction,
    });

    return {
        dailyLoop,
        examProgress,
        battleProgress,
        reviewLoad,
        dailyGoals,
        recommendedNextAction,
    };
};

export const mergeGameLoopStats = (stats = {}, overrides = {}) => {
    const normalizedStats = normalizeStoryProgressionStats(stats);

    return {
        ...normalizedStats,
        ...getGameLoopSnapshot(normalizedStats, overrides),
    };
};
