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

export function resolveWinnerUid(roomData, targetCorrect = 10) {
    const player1 = roomData?.player1;
    const player2 = roomData?.player2;

    if (!player1 || !player2) {
        return null;
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
