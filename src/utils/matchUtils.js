export const FRIEND_MATCH_TARGET_OPTIONS = [5, 10, 15, 20];
export const FRIEND_MATCH_MODE_OPTIONS = ['classic', 'listening'];
export const TUG_GAUGE_LIMIT = 100;
export const TUG_WRONG_PENALTY = 6;
export const TUG_BASE_PUSH = 10;

const TUG_CHAIN_MULTIPLIERS = [1, 1.2, 1.5, 1.8];

export function normalizeBattleMode(mode, fallback = 'classic') {
    const normalized = String(mode || '').trim().toLowerCase();
    return FRIEND_MATCH_MODE_OPTIONS.includes(normalized) ? normalized : fallback;
}

export function getBattleModeLabel(mode) {
    return normalizeBattleMode(mode) === 'listening' ? 'リスニング' : '通常';
}

export function normalizeTargetCorrect(targetCorrect, fallback = 10) {
    const parsed = Number(targetCorrect);

    if (FRIEND_MATCH_TARGET_OPTIONS.includes(parsed)) {
        return parsed;
    }

    return fallback;
}

export function shuffleArray(items) {
    const cloned = [...items];

    for (let index = cloned.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [cloned[index], cloned[swapIndex]] = [cloned[swapIndex], cloned[index]];
    }

    return cloned;
}

export function buildQuestionOptions(correctAnswer, allMeanings, optionCount = 4) {
    const uniqueWrongAnswers = [...new Set(allMeanings)].filter(
        (meaning) => meaning && meaning !== correctAnswer,
    );
    const distractors = shuffleArray(uniqueWrongAnswers).slice(0, Math.max(optionCount - 1, 0));

    return shuffleArray([correctAnswer, ...distractors]);
}

export function getNthCorrectAnswerTimestamp(answers = [], targetCorrect = 10) {
    const correctAnswers = answers
        .filter((answer) => answer?.isCorrect)
        .sort((left, right) => (left.timestamp || 0) - (right.timestamp || 0));

    return correctAnswers[targetCorrect - 1]?.timestamp ?? null;
}

export function summarizeAnswers(answers = []) {
    const answeredCount = answers.length;
    const correctCount = answers.filter((answer) => answer?.isCorrect).length;
    const accuracy = answeredCount > 0
        ? Math.round((correctCount / answeredCount) * 100)
        : 0;

    return {
        answeredCount,
        correctCount,
        accuracy,
    };
}

export function getTugPushAmount(streak = 1) {
    const normalizedStreak = Math.max(1, Math.floor(Number(streak) || 1));
    const multiplier = TUG_CHAIN_MULTIPLIERS[Math.min(normalizedStreak, 4) - 1] || TUG_CHAIN_MULTIPLIERS[TUG_CHAIN_MULTIPLIERS.length - 1];

    return Math.round(TUG_BASE_PUSH * multiplier);
}

export function clampTugPosition(position, limit = TUG_GAUGE_LIMIT) {
    const numericPosition = Number(position) || 0;
    return Math.max(-limit, Math.min(limit, numericPosition));
}

export function resolveTugAdvantageMeta(position, perspective = 'player1') {
    const numericPosition = clampTugPosition(position);
    const relativePosition = perspective === 'player2' ? -numericPosition : numericPosition;
    const absolutePosition = Math.abs(relativePosition);

    if (absolutePosition < 20) {
        return {
            label: '拮抗',
            detail: '次の1問で流れが動きます',
            tone: 'neutral',
        };
    }

    if (relativePosition >= 50) {
        return {
            label: '大優勢',
            detail: 'このまま押し切る流れです',
            tone: 'lead',
        };
    }

    if (relativePosition >= 20) {
        return {
            label: '優勢',
            detail: '主導権を握っています',
            tone: 'lead',
        };
    }

    if (relativePosition <= -50) {
        return {
            label: '大劣勢',
            detail: '連鎖で押し返したい場面です',
            tone: 'chase',
        };
    }

    return {
        label: '劣勢',
        detail: '次で流れを戻せます',
        tone: 'chase',
    };
}

export function resolveTugMomentumEvent({
    previousPosition = 0,
    nextPosition = 0,
    actingPlayer = 'player1',
    isCorrect = false,
    streak = 0,
} = {}) {
    if (!isCorrect) {
        return null;
    }

    const previous = clampTugPosition(previousPosition);
    const next = clampTugPosition(nextPosition);
    const towardActor = actingPlayer === 'player2' ? -1 : 1;
    const actorPrevious = previous * towardActor;
    const actorNext = next * towardActor;
    const swing = actorNext - actorPrevious;

    if (actorPrevious < 0 && actorNext > 0) {
        return {
            type: 'lead_change',
            label: '逆転！',
            detail: '一気に主導権を奪い返した',
            tone: 'swing',
        };
    }

    if (actorPrevious <= -40 && swing >= 10) {
        return {
            type: 'comeback',
            label: '押し返した！',
            detail: '劣勢から流れを戻した',
            tone: 'swing',
        };
    }

    if (streak >= 4) {
        return {
            type: 'dominating',
            label: 'DOMINATING',
            detail: '連鎖で一気に押し込んだ',
            tone: 'pressure',
        };
    }

    if (streak >= 2) {
        return {
            type: 'pressure',
            label: streak >= 3 ? 'CHAIN PRESSURE' : 'PRESSURE',
            detail: '連鎖でプレッシャーをかけた',
            tone: 'pressure',
        };
    }

    return null;
}

export function resolveWinnerUid(roomData, targetCorrect = 10) {
    const player1 = roomData?.player1;
    const player2 = roomData?.player2;

    if (!player1 || !player2) {
        return null;
    }

    const tugPosition = Number(roomData?.tugPosition);
    if (
        Number.isFinite(tugPosition) &&
        tugPosition !== 0 &&
        (roomData?.finishReason === 'gauge_breakthrough' || roomData?.finishReason === 'questions_exhausted')
    ) {
        return tugPosition > 0 ? player1.uid : player2.uid;
    }

    const player1Score = player1.score || 0;
    const player2Score = player2.score || 0;

    if (player1Score > player2Score) {
        return player1.uid;
    }

    if (player2Score > player1Score) {
        return player2.uid;
    }

    const player1TargetAt = getNthCorrectAnswerTimestamp(player1.answers, targetCorrect);
    const player2TargetAt = getNthCorrectAnswerTimestamp(player2.answers, targetCorrect);

    if (player1TargetAt !== null && player2TargetAt === null) {
        return player1.uid;
    }

    if (player2TargetAt !== null && player1TargetAt === null) {
        return player2.uid;
    }

    if (player1TargetAt !== null && player2TargetAt !== null) {
        if (player1TargetAt < player2TargetAt) {
            return player1.uid;
        }

        if (player2TargetAt < player1TargetAt) {
            return player2.uid;
        }
    }

    return null;
}
