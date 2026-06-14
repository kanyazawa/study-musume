import { getLastStudyTopic } from '../data/studyData';
import { getCharacterLabel } from '../data/characterData';
import { getDailyLoopSummary } from './dailyLoopUtils';
import { getStoredGoalData } from './goalUtils';
import { DEFAULT_RATING, getLevelFromRating, getNextLevelInfo, getRankFromRating } from './ratingUtils';
import { getHomeReviewSummary } from './reviewUtils';
import { normalizeStoryProgressionStats } from './storyProgressionUtils';

export { getStoredGoalData };

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

const WEEKDAY_LABELS = {
    mon: '月',
    tue: '火',
    wed: '水',
    thu: '木',
    fri: '金',
    sat: '土',
    sun: '日',
};

const TIME_SLOT_LABELS = {
    morning: '朝',
    day: '昼',
    afterSchool: '放課後',
    night: '夜',
};

const PROMISE_LOCATION_LABELS = {
    library: '図書室',
    classroom: '教室',
    cafe: 'カフェ',
    rooftop: '屋上',
    hallway: '廊下',
};

const getPromiseLocationLabel = (promise = {}) => (
    promise.locationLabel
    || PROMISE_LOCATION_LABELS[promise.locationId]
    || '校内'
);

const getRouteLabel = ({ routeStatus, hasPromise, reviewDueCount }) => {
    if (reviewDueCount > 0 && hasPromise) {
        return '約束はあるけど、先に片づけたいことがある';
    }
    if (reviewDueCount > 0) {
        return '積み残しを片づける日';
    }
    if (routeStatus === 'locked') {
        return '特別な相手との時間が、少しずつ形になってきた';
    }
    if (routeStatus === 'pending') {
        return '今日は少しだけ、放課後が気になる';
    }
    return '少しずつ、勉強する時間が当たり前になってきた';
};

const getTodayMoodCopy = ({ routeStatus, hasPromise, reviewDueCount, focusCharacterLabel }) => {
    if (reviewDueCount > 0 && hasPromise) {
        return '期限切れの弱点を片づけると、放課後の時間を気持ちよく使える';
    }
    if (reviewDueCount > 0) {
        return `今日は復習を先に終わらせると、${focusCharacterLabel}にも頑張りがちゃんと伝わる`;
    }
    if (hasPromise) {
        return '授業を進めてから会いに行くと、昨日の続きが自然につながりそう';
    }
    if (routeStatus === 'locked') {
        return '今日の勉強時間も、特別な関係を育てる大事な積み重ねになる';
    }
    return '今日は新しい内容を進めると、放課後の会話も自然につながりそう';
};

const getStudyPriority = ({ reviewDueCount }) => (
    reviewDueCount > 0 ? 'review' : 'study'
);

const getStudyPriorityLabel = ({ reviewDueCount, hasPromise }) => {
    if (reviewDueCount > 0 && hasPromise) {
        return '約束の前に復習を終えたい日';
    }
    if (reviewDueCount > 0) {
        return 'まずは復習を優先したい日';
    }
    if (hasPromise) {
        return '授業を進めてから会いたい日';
    }
    return 'まずは授業を進めたい日';
};

const getReviewPriorityLabel = (reviewDueCount) => (
    reviewDueCount > 0 ? '期限切れの復習がある' : '復習の急ぎはない'
);

const getActivePromise = (stats = {}) => {
    const activePromises = Array.isArray(stats?.promiseState?.activePromises)
        ? stats.promiseState.activePromises
        : [];

    return activePromises.find((promise) => promise?.status === 'scheduled' || promise?.status === 'available') || null;
};

const buildFeaturedPromise = ({ activePromise, reviewDueCount, characterLabel }) => {
    if (!activePromise) {
        return null;
    }

    return {
        id: activePromise.id,
        title: activePromise.title || `${characterLabel}との予定`,
        characterId: activePromise.characterId || null,
        characterLabel,
        timeSlotLabel: TIME_SLOT_LABELS[activePromise.timeSlot] || '放課後',
        locationLabel: getPromiseLocationLabel(activePromise),
        status: activePromise.status || 'scheduled',
        body: reviewDueCount > 0
            ? 'このまま会いに行くこともできるけど、今日は先に復習を終えたい'
            : 'この前の続きの勉強を一緒に進める約束がある',
        hint: reviewDueCount > 0
            ? '期限切れの弱点を片づけると、放課後の時間を気持ちよく使える'
            : '先に今日の課題を少し進めておくと会話がつながりやすい',
        actionLabel: reviewDueCount > 0 ? 'まず復習する' : '会いに行く',
        actionRoutePath: reviewDueCount > 0 ? '/review' : '/character',
    };
};

export const getStoryProgressSummary = (stats = {}, reviewSummary = null) => {
    const normalizedStats = normalizeStoryProgressionStats(stats);
    const calendarState = normalizedStats?.calendarState || {};
    const routeState = normalizedStats?.routeState || {};
    const reviewDueCount = Math.max(0, Number(reviewSummary?.due) || 0);
    const isEmmaMvp = normalizedStats?.tutorialHomeVariant === 'emma-mvp';
    const focusCharacterId = routeState.characterId
        || routeState.pendingCharacterId
        || normalizedStats?.selectedHeroineId
        || normalizedStats?.favoriteCharacter
        || normalizedStats?.characterId
        || 'noah';
    const shouldUseEmmaMvpLabel = isEmmaMvp && focusCharacterId === 'emma';
    const focusCharacterLabel = shouldUseEmmaMvpLabel ? '高瀬エマ' : getCharacterLabel(focusCharacterId);
    const routeStatus = routeState.status || 'common';
    const activePromise = getActivePromise(normalizedStats);
    const hasPromise = Boolean(activePromise);
    const studyPriority = getStudyPriority({ reviewDueCount, hasPromise });

    return {
        dateLabel: `${Number(calendarState.month || 4)}月${Number(calendarState.day || 1)}日`,
        weekdayLabel: WEEKDAY_LABELS[calendarState.weekday] || '月',
        timeSlotLabel: TIME_SLOT_LABELS[calendarState.timeSlot] || '朝',
        focusCharacterId,
        focusCharacterLabel,
        routeStatus,
        routeLabel: getRouteLabel({ routeStatus, hasPromise, reviewDueCount }),
        todayMoodCopy: getTodayMoodCopy({ routeStatus, hasPromise, reviewDueCount, focusCharacterLabel }),
        studyPriority,
        studyPriorityLabel: getStudyPriorityLabel({ reviewDueCount, hasPromise }),
        reviewPriority: reviewDueCount > 0 ? 'due' : 'clear',
        reviewPriorityLabel: getReviewPriorityLabel(reviewDueCount),
        featuredPromise: buildFeaturedPromise({
            activePromise,
            reviewDueCount,
            characterLabel: activePromise?.characterId
                ? ((isEmmaMvp && activePromise.characterId === 'emma') ? '高瀬エマ' : getCharacterLabel(activePromise.characterId))
                : focusCharacterLabel,
        }),
        primaryActionHint: reviewDueCount > 0 ? 'まず復習する' : '授業を進める',
        secondaryActionHint: hasPromise ? '約束を確認する' : (shouldUseEmmaMvpLabel ? 'エマと話す' : '交流を見る'),
    };
};

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
    storyProgressSummary: getStoryProgressSummary({}, {
        hasReviews: false,
        due: 0,
        soonCount: 0,
    }),
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
    const storyProgressSummary = getStoryProgressSummary(stats, reviewSummary);

    return {
        dailyLoop,
        examProgress,
        battleProgress,
        reviewLoad,
        dailyGoals,
        recommendedNextAction,
        storyProgressSummary,
    };
};

export const mergeGameLoopStats = (stats = {}, overrides = {}) => {
    const normalizedStats = normalizeStoryProgressionStats(stats);

    return {
        ...normalizedStats,
        ...getGameLoopSnapshot(normalizedStats, overrides),
    };
};
