const REVIEW_HARD_THRESHOLD = 3;

const getReviewChallengeScore = ({
    questionType = 'choice',
    wrongCount = 0,
    priority = 'later',
    reviewLevel = 0,
} = {}) => {
    let score = 0;

    if (questionType === 'reorder') {
        score += 2;
    } else if (questionType === 'input') {
        score += 1;
    }

    if (wrongCount >= 2) {
        score += 2;
    } else if (wrongCount >= 1) {
        score += 1;
    }

    if (priority === 'urgent') {
        score += 1;
    }

    if (reviewLevel >= 4) {
        score += 1;
    }

    return score;
};

const getDialogueChallengeScore = ({ quizKind = 'choice' } = {}) => {
    if (quizKind === 'reorder' || quizKind === 'error_fix') {
        return 3;
    }

    if (quizKind === 'fill_blank') {
        return 2;
    }

    return 0;
};

export const getReactionEmotion = (tone, fallback = null) => {
    switch (tone) {
        case 'correct':
            return 'smile';
        case 'chain_correct':
        case 'comeback_correct':
            return 'happy';
        case 'hard_correct':
        case 'clutch_correct':
            return 'surprised';
        case 'hard_incorrect':
        case 'timeout':
            return 'serious';
        case 'incorrect':
            return 'angry';
        default:
            return fallback;
    }
};

const REACTION_VOICE_FILES = {
    noah: {
        chain_correct: [
            'tts-generated/home-reactions/noah/noah-highStreak-01.mp3',
            'tts-generated/home-reactions/noah/noah-highStreak-02.mp3',
            'tts-generated/home-reactions/noah/noah-highStreak-03.mp3',
        ],
        comeback_correct: [
            'tts-generated/home-reactions/noah/noah-reviewFocus-01.mp3',
            'tts-generated/home-reactions/noah/noah-reviewFocus-02.mp3',
            'tts-generated/home-reactions/noah/noah-reviewFocus-03.mp3',
        ],
        hard_correct: [
            'tts-generated/home-reactions/noah/noah-highAffection-01.mp3',
            'tts-generated/home-reactions/noah/noah-highAffection-02.mp3',
            'tts-generated/home-reactions/noah/noah-highAffection-03.mp3',
        ],
        clutch_correct: [
            'tts-generated/home-reactions/noah/noah-highStreak-04.mp3',
            'tts-generated/home-reactions/noah/noah-highStreak-05.mp3',
            'tts-generated/home-reactions/noah/noah-highStreak-06.mp3',
        ],
    },
};

const reactionVoiceHistory = new Map();
const REACTION_RARE_CHAIN_THRESHOLD = 5;
const REACTION_RARE_CHAIN_CHANCE = 0.28;
const REACTION_RARE_VOICE_FILES = {
    noah: {
        chain_correct: [
            'tts-generated/home-reactions/noah/noah-highStreak-04.mp3',
            'tts-generated/home-reactions/noah/noah-highStreak-05.mp3',
            'tts-generated/home-reactions/noah/noah-highStreak-06.mp3',
        ],
    },
};

export const __resetReactionVoiceHistoryForTests = () => {
    reactionVoiceHistory.clear();
};

export const getReactionVoiceCandidates = ({ characterId = 'noah', tone = null, streak = 0, includeRare = true } = {}) => {
    const reactionVoiceMap = REACTION_VOICE_FILES[characterId];
    if (!reactionVoiceMap || !tone) {
        return [];
    }

    const baseCandidates = Array.isArray(reactionVoiceMap[tone]) ? reactionVoiceMap[tone] : [];
    if (!includeRare) {
        return baseCandidates;
    }

    const rareVoiceMap = REACTION_RARE_VOICE_FILES[characterId];
    const rareCandidates = streak >= REACTION_RARE_CHAIN_THRESHOLD && rareVoiceMap && Array.isArray(rareVoiceMap[tone])
        ? rareVoiceMap[tone]
        : [];

    return [...baseCandidates, ...rareCandidates];
};

export const getReactionVoiceFile = ({ characterId = 'noah', tone = null, streak = 0 } = {}) => {
    return resolveReactionVoiceSelection({ characterId, tone, streak }).file;
};

export const shouldTriggerReactionFeverFx = ({ tone = null, streak = 0, isRare = false } = {}) => (
    tone === 'chain_correct'
    && streak >= REACTION_RARE_CHAIN_THRESHOLD
    && (streak === REACTION_RARE_CHAIN_THRESHOLD || isRare)
);

export const resolveReactionVoiceSelection = ({ characterId = 'noah', tone = null, streak = 0 } = {}) => {
    const baseCandidates = getReactionVoiceCandidates({ characterId, tone, streak, includeRare: false });
    const allCandidates = getReactionVoiceCandidates({ characterId, tone, streak, includeRare: true });
    const isRareChainEligible = tone === 'chain_correct' && streak >= REACTION_RARE_CHAIN_THRESHOLD;
    const hasRareCandidates = allCandidates.length > baseCandidates.length;
    const shouldUseRareCandidate = hasRareCandidates && (
        streak === REACTION_RARE_CHAIN_THRESHOLD
        || (isRareChainEligible && Math.random() < REACTION_RARE_CHAIN_CHANCE)
    );
    const shouldTriggerFeverFx = shouldTriggerReactionFeverFx({
        tone,
        streak,
        isRare: shouldUseRareCandidate,
    });
    const candidates = shouldUseRareCandidate
        ? allCandidates.slice(baseCandidates.length)
        : baseCandidates;

    if (candidates.length === 0) {
        return { file: null, isRare: false, shouldTriggerFeverFx };
    }

    const historyKey = `${characterId}:${tone}`;
    const lastPlayed = reactionVoiceHistory.get(historyKey);
    const selectableCandidates = candidates.length > 1
        ? candidates.filter((candidate) => candidate !== lastPlayed)
        : candidates;
    const nextVoiceFile = selectableCandidates[Math.floor(Math.random() * selectableCandidates.length)] || candidates[0];

    reactionVoiceHistory.set(historyKey, nextVoiceFile);
    return {
        file: nextVoiceFile,
        isRare: shouldUseRareCandidate,
        shouldTriggerFeverFx,
    };
};

export const getReviewFeedbackCopy = ({ feedback = null, tone = null, manualAdvance = false } = {}) => {
    if (feedback === 'correct') {
        switch (tone) {
            case 'comeback_correct':
                return {
                    banner: 'ナイス立て直し！',
                    detail: '崩れた後に取り返せるの、かなり強いです。',
                };
            case 'hard_correct':
                return {
                    banner: 'その難問、取れたね！',
                    detail: '難しいところを抜けたので、かなり良い復習です。',
                };
            case 'chain_correct':
                return {
                    banner: '流れ、来てる！',
                    detail: 'このまま復習間隔を伸ばして次へ進みます。',
                };
            default:
                return {
                    banner: '正解！',
                    detail: '復習間隔を伸ばして次へ進みます。',
                };
        }
    }

    if (feedback === 'incorrect') {
        if (tone === 'hard_incorrect') {
            return {
                banner: 'いい挑戦だったよ。',
                detail: manualAdvance
                    ? '答えを確認したら、下のボタンで次へ進めます。'
                    : '難しい問題なので、近いうちにもう一度出します。',
            };
        }

        return {
            banner: '惜しい、ここで拾い直そう。',
            detail: manualAdvance
                ? '答えを確認したら、下のボタンで次へ進めます。'
                : '復習間隔をリセットして次へ進みます。',
        };
    }

    return {
        banner: '',
        detail: '',
    };
};

export const getDialogueFeedbackOverlayCopy = ({ feedback = null, tone = null } = {}) => {
    if (feedback === 'correct') {
        switch (tone) {
            case 'comeback_correct':
                return '⭕ Nice comeback!';
            case 'hard_correct':
                return '⭕ Big brain!';
            case 'chain_correct':
                return '⭕ On a roll!';
            default:
                return '⭕ Perfect!';
        }
    }

    if (feedback === 'incorrect') {
        if (tone === 'hard_incorrect') {
            return '❌ Good try...';
        }

        return '❌ Try again...';
    }

    return '';
};

export const getDialogueReactionLine = ({
    tone = null,
    isCorrect = false,
    correctAnswer = '',
} = {}) => {
    if (isCorrect) {
        switch (tone) {
            case 'comeback_correct':
                return '今の立て直し、すごく良かったよ。ちゃんと戻してきたね。';
            case 'hard_correct':
                return 'その問題を取れるの、かなり強いよ。ちゃんと力ついてる。';
            case 'chain_correct':
                return 'いい流れ。このままもう一問いけそう。';
            default:
                return 'うん、いい感じ。この調子でいこう。';
        }
    }

    switch (tone) {
        case 'hard_incorrect':
            return '今のは難しかったね。でもそこに挑んだの、ちゃんとえらいよ。';
        default:
            return `惜しい。正解は ${correctAnswer || 'これ'} だよ。次は取れる。`;
    }
};

export const getMatchFeedbackCopy = ({
    tone = null,
    answerKind = 'answer',
} = {}) => {
    if (answerKind === 'timeout' || tone === 'timeout') {
        return {
            title: '⌛',
            detail: 'ギリギリまで粘れた。次で取り返そう。',
        };
    }

    if (answerKind === 'skip') {
        return {
            title: '🤔',
            detail: '正解を見てリズムを戻そう。',
        };
    }

    if (tone === 'incorrect') {
        return {
            title: '❌',
            detail: '惜しい。次の一問で流れを切り替えよう。',
        };
    }

    return {
        title: '❌',
        detail: '次で取り返そう。',
    };
};

export const resolveReviewReactionTone = ({
    isCorrect = false,
    nextCorrectStreak = 0,
    previousResult = null,
    questionType = 'choice',
    wrongCount = 0,
    priority = 'later',
    reviewLevel = 0,
} = {}) => {
    const challengeScore = getReviewChallengeScore({ questionType, wrongCount, priority, reviewLevel });
    const isHardQuestion = challengeScore >= REVIEW_HARD_THRESHOLD;

    if (isCorrect) {
        if (previousResult === 'incorrect') {
            return 'comeback_correct';
        }

        if (isHardQuestion) {
            return 'hard_correct';
        }

        if (nextCorrectStreak >= 2) {
            return 'chain_correct';
        }

        return 'correct';
    }

    return isHardQuestion ? 'hard_incorrect' : 'incorrect';
};

export const resolveDialogueReactionTone = ({
    isCorrect = false,
    nextCorrectStreak = 0,
    previousResult = null,
    quizKind = 'choice',
} = {}) => {
    const challengeScore = getDialogueChallengeScore({ quizKind });
    const isHardQuestion = challengeScore >= REVIEW_HARD_THRESHOLD;

    if (isCorrect) {
        if (previousResult === 'incorrect') {
            return 'comeback_correct';
        }

        if (isHardQuestion) {
            return 'hard_correct';
        }

        if (nextCorrectStreak >= 2) {
            return 'chain_correct';
        }

        return 'correct';
    }

    return isHardQuestion ? 'hard_incorrect' : 'incorrect';
};

export const resolveMatchReactionTone = ({
    isCorrect = false,
    nextCorrectStreak = 0,
    previousResult = null,
    timerRemaining = 0,
    scoreGap = 0,
    answerKind = 'answer',
} = {}) => {
    if (isCorrect) {
        if (timerRemaining <= 2) {
            return 'clutch_correct';
        }

        if (previousResult === 'incorrect' || previousResult === 'timeout' || scoreGap < 0) {
            return 'comeback_correct';
        }

        if (nextCorrectStreak >= 2) {
            return 'chain_correct';
        }

        return 'correct';
    }

    if (answerKind === 'timeout') {
        return 'timeout';
    }

    return 'incorrect';
};
