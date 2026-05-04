const DAILY_LOOP_PHASE_ORDER = ['study', 'practice', 'battle'];

export const DAILY_LOOP_REWARD = {
    diamonds: 25,
    intellect: 20,
    tp: 15,
    affection: 15,
};

export const DAILY_LOOP_PHASE_META = {
    study: {
        id: 'study',
        label: '授業',
        shortLabel: '授業',
        icon: '📚',
        routePath: '/study',
        ctaLabel: '授業へ',
        hint: '新しい内容を1つ進めよう',
    },
    practice: {
        id: 'practice',
        label: '演習',
        shortLabel: '演習',
        icon: '📝',
        routePath: '/study',
        ctaLabel: '演習へ',
        hint: '復習や読解で仕上げよう',
    },
    battle: {
        id: 'battle',
        label: '実戦',
        shortLabel: '実戦',
        icon: '⚔️',
        routePath: '/multiplayer-match',
        ctaLabel: '実戦へ',
        hint: '単語バトルで確認しよう',
    },
};

const toValidDate = (value = new Date()) => {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

const toDateKey = (value = new Date()) => {
    const date = toValidDate(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getPreviousDateKey = (value = new Date()) => {
    const date = toValidDate(value);
    date.setDate(date.getDate() - 1);
    return toDateKey(date);
};

const createEmptyPhaseMap = () => ({
    study: false,
    practice: false,
    battle: false,
});

export const getDefaultDailyLoopState = (value = new Date()) => ({
    date: toDateKey(value),
    completedPhases: createEmptyPhaseMap(),
    rewardClaimed: false,
    completedAt: null,
    claimedAt: null,
    totalClears: 0,
    streak: 0,
    bestStreak: 0,
    lastClaimDate: '',
});

export const normalizeDailyLoopState = (rawState, value = new Date()) => {
    const today = toDateKey(value);
    const fallback = getDefaultDailyLoopState(value);
    const safeState = rawState && typeof rawState === 'object' ? rawState : {};
    const completedPhases = {
        ...createEmptyPhaseMap(),
        ...(safeState.completedPhases && typeof safeState.completedPhases === 'object'
            ? safeState.completedPhases
            : {}),
    };
    const preservedMeta = {
        totalClears: Math.max(0, Number(safeState.totalClears) || 0),
        streak: Math.max(0, Number(safeState.streak) || 0),
        bestStreak: Math.max(0, Number(safeState.bestStreak) || 0),
        lastClaimDate: String(safeState.lastClaimDate || ''),
    };

    if (String(safeState.date || '') !== today) {
        return {
            ...fallback,
            ...preservedMeta,
        };
    }

    return {
        ...fallback,
        ...preservedMeta,
        date: today,
        completedPhases: {
            study: Boolean(completedPhases.study),
            practice: Boolean(completedPhases.practice),
            battle: Boolean(completedPhases.battle),
        },
        rewardClaimed: Boolean(safeState.rewardClaimed),
        completedAt: safeState.completedAt ?? null,
        claimedAt: safeState.claimedAt ?? null,
    };
};

const hasClearedAllPhases = (completedPhases = {}) => (
    DAILY_LOOP_PHASE_ORDER.every((phase) => Boolean(completedPhases[phase]))
);

export const buildDailyLoopPhasePatch = (stats = {}, phase, value = new Date()) => {
    if (!DAILY_LOOP_PHASE_META[phase]) {
        return null;
    }

    const dailyLoopState = normalizeDailyLoopState(stats?.dailyLoopState, value);
    if (dailyLoopState.completedPhases[phase]) {
        return null;
    }

    const completedPhases = {
        ...dailyLoopState.completedPhases,
        [phase]: true,
    };
    const clearedAll = hasClearedAllPhases(completedPhases);

    return {
        dailyLoopState: {
            ...dailyLoopState,
            completedPhases,
            completedAt: clearedAll ? (dailyLoopState.completedAt || Date.now()) : dailyLoopState.completedAt,
        },
    };
};

export const buildDailyLoopRewardPatch = (stats = {}, value = new Date()) => {
    const dailyLoopState = normalizeDailyLoopState(stats?.dailyLoopState, value);
    if (!hasClearedAllPhases(dailyLoopState.completedPhases) || dailyLoopState.rewardClaimed) {
        return null;
    }

    const today = toDateKey(value);
    const yesterday = getPreviousDateKey(value);
    const nextStreak = dailyLoopState.lastClaimDate === yesterday
        ? dailyLoopState.streak + 1
        : 1;
    const nextTp = Math.min(
        Math.max(0, Number(stats?.maxTp) || 0),
        Math.max(0, Number(stats?.tp) || 0) + DAILY_LOOP_REWARD.tp,
    );

    return {
        diamonds: Math.max(0, Number(stats?.diamonds) || 0) + DAILY_LOOP_REWARD.diamonds,
        intellect: Math.max(0, Number(stats?.intellect) || 0) + DAILY_LOOP_REWARD.intellect,
        affection: Math.max(0, Number(stats?.affection) || 0) + DAILY_LOOP_REWARD.affection,
        tp: nextTp,
        dailyLoopState: {
            ...dailyLoopState,
            rewardClaimed: true,
            claimedAt: Date.now(),
            lastClaimDate: today,
            totalClears: dailyLoopState.totalClears + 1,
            streak: nextStreak,
            bestStreak: Math.max(dailyLoopState.bestStreak, nextStreak),
        },
    };
};

export const getDailyLoopSummary = (stats = {}, value = new Date()) => {
    const dailyLoopState = normalizeDailyLoopState(stats?.dailyLoopState, value);
    const phases = DAILY_LOOP_PHASE_ORDER.map((phase) => ({
        ...DAILY_LOOP_PHASE_META[phase],
        completed: Boolean(dailyLoopState.completedPhases[phase]),
    }));
    const completedCount = phases.filter((phase) => phase.completed).length;
    const totalCount = phases.length;
    const isComplete = completedCount === totalCount;
    const isClaimed = dailyLoopState.rewardClaimed;
    const isClaimable = isComplete && !isClaimed;
    const nextPhase = phases.find((phase) => !phase.completed) || null;

    let title = `今日の育成ルート ${completedCount}/${totalCount}`;
    let subtitle = nextPhase
        ? `${nextPhase.icon} ${nextPhase.hint}`
        : '3フェーズ達成で報酬を受け取れるよ';
    let actionLabel = nextPhase?.ctaLabel || 'ホームを見る';
    let actionRoutePath = nextPhase?.routePath || '/home';
    let actionType = nextPhase ? 'navigate' : 'idle';

    if (isClaimable) {
        title = 'ルートクリア報酬を受け取ろう';
        subtitle = '今日の授業・演習・実戦がそろったよ';
        actionLabel = '報酬を受け取る';
        actionRoutePath = null;
        actionType = 'claim';
    } else if (isClaimed) {
        title = '今日の育成ルート完了';
        subtitle = dailyLoopState.streak > 1
            ? `🔥 ${dailyLoopState.streak}日連続でクリア中`
            : 'また明日も3フェーズをつなげよう';
        actionLabel = 'ミッションへ';
        actionRoutePath = '/missions';
        actionType = 'navigate';
    }

    return {
        ...dailyLoopState,
        phases,
        reward: DAILY_LOOP_REWARD,
        completedCount,
        totalCount,
        progressPercent: Math.round((completedCount / totalCount) * 100),
        isComplete,
        isClaimed,
        isClaimable,
        nextPhase,
        title,
        subtitle,
        actionLabel,
        actionRoutePath,
        actionType,
    };
};
