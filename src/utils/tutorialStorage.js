export const TUTORIAL_STORAGE_KEYS = {
    tutorialCompleted: 'tutorialCompleted',
    favoriteCharacter: 'favoriteCharacter',
    affection: 'affection',
    gems: 'gems',
    ownedItems: 'ownedItems',
    progress: 'tutorialProgress',
};

export const TUTORIAL_STEPS = {
    OPENING: 'opening',
    CHARACTER: 'character',
    QUIZ: 'quiz',
    RESULT: 'result',
    GACHA: 'gacha',
    EVENT: 'event',
};

const normalizeTutorialStep = (step) => {
    if (step === TUTORIAL_STEPS.CHARACTER) {
        return TUTORIAL_STEPS.QUIZ;
    }

    if (step === TUTORIAL_STEPS.GACHA) {
        return TUTORIAL_STEPS.EVENT;
    }

    if (
        step !== TUTORIAL_STEPS.OPENING
        && step !== TUTORIAL_STEPS.QUIZ
        && step !== TUTORIAL_STEPS.RESULT
        && step !== TUTORIAL_STEPS.EVENT
    ) {
        return TUTORIAL_STEPS.OPENING;
    }

    return step;
};

const parseJson = (value, fallback) => {
    if (!value) {
        return fallback;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn('Failed to parse tutorial storage JSON:', error);
        return fallback;
    }
};

const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const getDefaultTutorialProgress = () => ({
    step: TUTORIAL_STEPS.OPENING,
    initializedStats: false,
    selectedCharacterId: null,
    openingLineIndex: 0,
    quizIndex: 0,
    quizAnswers: [],
    pendingQuizResult: null,
    correctCount: 0,
    affectionEarned: 0,
    gemsEarned: 0,
    bonusGemsAwarded: 0,
    gachaDrawn: false,
    gachaResults: [],
    resultLineIndex: 0,
    eventLineIndex: 0,
});

export const loadTutorialProgress = () => {
    const savedProgress = parseJson(localStorage.getItem(TUTORIAL_STORAGE_KEYS.progress), {});
    return {
        ...getDefaultTutorialProgress(),
        ...(savedProgress || {}),
        step: normalizeTutorialStep(savedProgress?.step),
    };
};

export const saveTutorialProgress = (progress) => {
    const nextProgress = {
        ...getDefaultTutorialProgress(),
        ...(progress || {}),
    };

    localStorage.setItem(TUTORIAL_STORAGE_KEYS.progress, JSON.stringify(nextProgress));
    return nextProgress;
};

export const clearTutorialProgress = () => {
    localStorage.removeItem(TUTORIAL_STORAGE_KEYS.progress);
};

export const loadStandaloneTutorialSnapshot = () => ({
    tutorialCompleted: localStorage.getItem(TUTORIAL_STORAGE_KEYS.tutorialCompleted) === null
        ? null
        : localStorage.getItem(TUTORIAL_STORAGE_KEYS.tutorialCompleted) === 'true',
    favoriteCharacter: localStorage.getItem(TUTORIAL_STORAGE_KEYS.favoriteCharacter) || null,
    affection: parseNumber(localStorage.getItem(TUTORIAL_STORAGE_KEYS.affection)),
    gems: parseNumber(localStorage.getItem(TUTORIAL_STORAGE_KEYS.gems)),
    ownedItems: parseJson(localStorage.getItem(TUTORIAL_STORAGE_KEYS.ownedItems), null),
});

export const syncStandaloneTutorialSnapshot = ({
    tutorialCompleted,
    favoriteCharacter,
    affection,
    gems,
    ownedItems,
}) => {
    if (tutorialCompleted !== undefined) {
        localStorage.setItem(TUTORIAL_STORAGE_KEYS.tutorialCompleted, tutorialCompleted ? 'true' : 'false');
    }

    if (favoriteCharacter !== undefined) {
        if (favoriteCharacter) {
            localStorage.setItem(TUTORIAL_STORAGE_KEYS.favoriteCharacter, favoriteCharacter);
        } else {
            localStorage.removeItem(TUTORIAL_STORAGE_KEYS.favoriteCharacter);
        }
    }

    if (affection !== undefined) {
        localStorage.setItem(TUTORIAL_STORAGE_KEYS.affection, String(Math.max(0, Number(affection) || 0)));
    }

    if (gems !== undefined) {
        localStorage.setItem(TUTORIAL_STORAGE_KEYS.gems, String(Math.max(0, Number(gems) || 0)));
    }

    if (ownedItems !== undefined) {
        localStorage.setItem(TUTORIAL_STORAGE_KEYS.ownedItems, JSON.stringify(Array.isArray(ownedItems) ? ownedItems : []));
    }
};
