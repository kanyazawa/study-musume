import { getManualReviewScheduleChoices } from './reviewUtils';
import { touchCloudSaveData } from './saveUtils';

export const VOCAB_STUDY_STATE_STORAGE_KEY = 'vocabStudyState';

const DEFAULT_STATE = {
    progressByLevel: {},
    cycleByLevel: {},
};

const safeNumber = (value, fallback = 0) => {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : fallback;
};

const normalizeText = (value) => String(value ?? '').trim();

const normalizeWordKey = (value) => normalizeText(value).toLowerCase();

const buildEntryKey = ({ level, itemId = '', word = '' }) => {
    const normalizedLevel = normalizeText(level);
    const normalizedItemId = normalizeText(itemId);
    const normalizedWord = normalizeWordKey(word);

    if (!normalizedLevel || (!normalizedItemId && !normalizedWord)) {
        return '';
    }

    return normalizedItemId
        ? `${normalizedLevel}::${normalizedItemId}`
        : `${normalizedLevel}::${normalizedWord}`;
};

const shuffleItems = (items) => {
    const nextItems = [...items];

    for (let index = nextItems.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
    }

    return nextItems;
};

const loadState = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return DEFAULT_STATE;
    }

    try {
        const raw = window.localStorage.getItem(VOCAB_STUDY_STATE_STORAGE_KEY);
        if (!raw) {
            return DEFAULT_STATE;
        }

        const parsed = JSON.parse(raw);
        return {
            progressByLevel: parsed?.progressByLevel && typeof parsed.progressByLevel === 'object'
                ? parsed.progressByLevel
                : {},
            cycleByLevel: parsed?.cycleByLevel && typeof parsed.cycleByLevel === 'object'
                ? parsed.cycleByLevel
                : {},
        };
    } catch (error) {
        console.error('Failed to load vocab study state:', error);
        return DEFAULT_STATE;
    }
};

const saveState = (state) => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return state;
    }

    try {
        window.localStorage.setItem(VOCAB_STUDY_STATE_STORAGE_KEY, JSON.stringify(state));
        touchCloudSaveData();
    } catch (error) {
        console.error('Failed to save vocab study state:', error);
    }

    return state;
};

const normalizeProgressEntry = (entryKey, entry = {}) => {
    const word = normalizeText(entry.word);
    const meaning = normalizeText(entry.meaning);

    return {
        entryKey: normalizeText(entryKey),
        itemId: normalizeText(entry.itemId),
        word,
        meaning,
        attempts: Math.max(0, safeNumber(entry.attempts)),
        correctCount: Math.max(0, safeNumber(entry.correctCount)),
        wrongCount: Math.max(0, safeNumber(entry.wrongCount)),
        lastAnsweredAt: Math.max(0, safeNumber(entry.lastAnsweredAt)),
        lastCorrectAt: Math.max(0, safeNumber(entry.lastCorrectAt)),
        lastWrongAt: Math.max(0, safeNumber(entry.lastWrongAt)),
        flashcardLevel: Math.max(0, safeNumber(entry.flashcardLevel)),
        nextStudyAt: Math.max(0, safeNumber(entry.nextStudyAt)),
        flashcardRetired: Boolean(entry.flashcardRetired),
    };
};

const buildItemRecord = (item, level) => {
    const word = normalizeText(item?.word);
    const meaning = normalizeText(item?.meaning);
    const itemId = normalizeText(item?.id || item?.questionId);
    const entryKey = buildEntryKey({ level, itemId, word });

    if (!word || !meaning || !entryKey) {
        return null;
    }

    return {
        ...item,
        word,
        meaning,
        itemId,
        entryKey,
    };
};

const getUniqueItemRecords = (level, vocabItems = []) => {
    const seen = new Set();

    return (Array.isArray(vocabItems) ? vocabItems : [])
        .map((item) => buildItemRecord(item, level))
        .filter((item) => {
            if (!item || seen.has(item.entryKey)) {
                return false;
            }

            seen.add(item.entryKey);
            return true;
        });
};

const syncQueueWithItems = (queue = [], allKeys = []) => {
    const uniqueAllKeys = Array.from(new Set(allKeys));
    const activeSet = new Set(uniqueAllKeys);
    const nextQueue = [];

    queue.forEach((key) => {
        if (activeSet.has(key) && !nextQueue.includes(key)) {
            nextQueue.push(key);
        }
    });

    const missingKeys = uniqueAllKeys.filter((key) => !nextQueue.includes(key));
    if (nextQueue.length === 0) {
        return shuffleItems(uniqueAllKeys);
    }

    return [...nextQueue, ...shuffleItems(missingKeys)];
};

const getAccuracy = (progress) => {
    if (!progress?.attempts) {
        return 0;
    }

    return Math.round((progress.correctCount / progress.attempts) * 100);
};

const classifyProgress = (progress) => {
    const attempts = Math.max(0, safeNumber(progress?.attempts));
    const correctCount = Math.max(0, safeNumber(progress?.correctCount));
    const wrongCount = Math.max(0, safeNumber(progress?.wrongCount));
    const accuracy = getAccuracy(progress);

    if (attempts <= 0) return 'unseen';
    if ((wrongCount >= 2 && accuracy <= 50) || wrongCount > correctCount) return 'weak';
    if ((correctCount >= 2 && accuracy >= 70) || (attempts >= 3 && accuracy >= 80)) return 'strong';
    return 'learning';
};

export const getNextVocabBatchForLevel = (level, vocabItems, count) => {
    const normalizedLevel = normalizeText(level);
    const itemRecords = getUniqueItemRecords(normalizedLevel, vocabItems);
    const requestedCount = Math.max(0, Math.min(Math.floor(safeNumber(count, 0)), itemRecords.length));

    if (!normalizedLevel || requestedCount <= 0 || itemRecords.length === 0) {
        return [];
    }

    const state = loadState();
    const cycleState = state.cycleByLevel?.[normalizedLevel] || {};
    const itemMap = new Map(itemRecords.map((item) => [item.entryKey, item]));
    const allKeys = itemRecords.map((item) => item.entryKey);
    let queue = syncQueueWithItems(cycleState.queue, allKeys);
    let completedCycles = Math.max(0, safeNumber(cycleState.completedCycles));
    const selectedItems = [];

    while (selectedItems.length < requestedCount && allKeys.length > 0) {
        if (queue.length === 0) {
            queue = shuffleItems(allKeys);
            completedCycles += 1;
        }

        const nextKey = queue.shift();
        if (!nextKey) {
            break;
        }

        const nextItem = itemMap.get(nextKey);
        if (nextItem) {
            selectedItems.push(nextItem);
        }
    }

    state.cycleByLevel = {
        ...state.cycleByLevel,
        [normalizedLevel]: {
            queue,
            completedCycles,
            updatedAt: Date.now(),
        },
    };
    saveState(state);

    return selectedItems;
};

export const getFlashcardScheduleChoices = () => getManualReviewScheduleChoices({ reviewLevel: 0 })
    .map((choice) => (
        choice.complete
            ? {
                ...choice,
                label: 'もうやらない',
                description: '単語めくりから外す',
            }
            : choice
    ));

export const getNextFlashcardVocabBatchForLevel = (level, vocabItems, count) => {
    const normalizedLevel = normalizeText(level);
    const itemRecords = getUniqueItemRecords(normalizedLevel, vocabItems);
    const requestedCount = Math.max(0, Math.min(Math.floor(safeNumber(count, 0)), itemRecords.length));

    if (!normalizedLevel || requestedCount <= 0 || itemRecords.length === 0) {
        return [];
    }

    const state = loadState();
    const levelProgress = state.progressByLevel?.[normalizedLevel] || {};
    const now = Date.now();

    return itemRecords
        .map((item) => {
            const progress = normalizeProgressEntry(item.entryKey, levelProgress[item.entryKey]);
            const hasSchedule = progress.nextStudyAt > 0;
            const isDue = hasSchedule ? progress.nextStudyAt <= now : progress.attempts === 0;

            return {
                ...item,
                progress,
                nextStudyAt: progress.nextStudyAt,
                flashcardLevel: progress.flashcardLevel,
                flashcardRetired: progress.flashcardRetired,
                isDue,
                sortBucket: isDue ? 0 : hasSchedule ? 2 : 1,
            };
        })
        .filter((item) => !item.flashcardRetired)
        .sort((left, right) => {
            if (left.sortBucket !== right.sortBucket) {
                return left.sortBucket - right.sortBucket;
            }

            if (left.sortBucket === 0) {
                const dateDiff = (left.nextStudyAt || 0) - (right.nextStudyAt || 0);
                if (dateDiff !== 0) return dateDiff;
            }

            if (left.sortBucket === 2) {
                const dateDiff = (left.nextStudyAt || 0) - (right.nextStudyAt || 0);
                if (dateDiff !== 0) return dateDiff;
            }

            const attemptDiff = left.progress.attempts - right.progress.attempts;
            if (attemptDiff !== 0) return attemptDiff;

            return left.word.localeCompare(right.word);
        })
        .slice(0, requestedCount);
};

export const recordVocabAttempt = ({ level, word, meaning, itemId = '', isCorrect = false }) => {
    const normalizedLevel = normalizeText(level);
    const normalizedWord = normalizeText(word);
    const normalizedMeaning = normalizeText(meaning);
    const normalizedItemId = normalizeText(itemId);
    const entryKey = buildEntryKey({
        level: normalizedLevel,
        itemId: normalizedItemId,
        word: normalizedWord,
    });

    if (!normalizedLevel || !normalizedWord || !normalizedMeaning || !entryKey) {
        return null;
    }

    const state = loadState();
    const levelProgress = state.progressByLevel?.[normalizedLevel] || {};
    const currentEntry = normalizeProgressEntry(entryKey, levelProgress[entryKey]);
    const now = Date.now();
    const nextEntry = {
        ...currentEntry,
        itemId: normalizedItemId,
        word: normalizedWord,
        meaning: normalizedMeaning,
        attempts: currentEntry.attempts + 1,
        correctCount: currentEntry.correctCount + (isCorrect ? 1 : 0),
        wrongCount: currentEntry.wrongCount + (isCorrect ? 0 : 1),
        lastAnsweredAt: now,
        lastCorrectAt: isCorrect ? now : currentEntry.lastCorrectAt,
        lastWrongAt: isCorrect ? currentEntry.lastWrongAt : now,
    };

    state.progressByLevel = {
        ...state.progressByLevel,
        [normalizedLevel]: {
            ...levelProgress,
            [entryKey]: nextEntry,
        },
    };
    saveState(state);

    return {
        ...nextEntry,
        accuracy: getAccuracy(nextEntry),
        status: classifyProgress(nextEntry),
    };
};

export const recordVocabFlashcardSchedule = ({
    level,
    word,
    meaning,
    itemId = '',
    scheduleChoice,
}) => {
    const normalizedLevel = normalizeText(level);
    const normalizedWord = normalizeText(word);
    const normalizedMeaning = normalizeText(meaning);
    const normalizedItemId = normalizeText(itemId);
    const entryKey = buildEntryKey({
        level: normalizedLevel,
        itemId: normalizedItemId,
        word: normalizedWord,
    });

    if (!normalizedLevel || !normalizedWord || !normalizedMeaning || !entryKey || !scheduleChoice) {
        return null;
    }

    const state = loadState();
    const levelProgress = state.progressByLevel?.[normalizedLevel] || {};
    const currentEntry = normalizeProgressEntry(entryKey, levelProgress[entryKey]);
    const now = Date.now();
    const nextStudyAt = Math.max(0, safeNumber(scheduleChoice.nextReviewDate));
    const flashcardLevel = Math.max(0, safeNumber(scheduleChoice.reviewLevel));
    const isCorrect = flashcardLevel > 0;
    const flashcardRetired = Boolean(scheduleChoice.complete);
    const nextEntry = {
        ...currentEntry,
        itemId: normalizedItemId,
        word: normalizedWord,
        meaning: normalizedMeaning,
        attempts: currentEntry.attempts + 1,
        correctCount: currentEntry.correctCount + (isCorrect ? 1 : 0),
        wrongCount: currentEntry.wrongCount + (isCorrect ? 0 : 1),
        lastAnsweredAt: now,
        lastCorrectAt: isCorrect ? now : currentEntry.lastCorrectAt,
        lastWrongAt: isCorrect ? currentEntry.lastWrongAt : now,
        flashcardLevel,
        nextStudyAt,
        flashcardRetired,
    };

    state.progressByLevel = {
        ...state.progressByLevel,
        [normalizedLevel]: {
            ...levelProgress,
            [entryKey]: nextEntry,
        },
    };
    saveState(state);

    return {
        ...nextEntry,
        accuracy: getAccuracy(nextEntry),
        status: classifyProgress(nextEntry),
        isCorrect,
    };
};

export const getVocabLevelProgress = (level, vocabItems = []) => {
    const normalizedLevel = normalizeText(level);
    const itemRecords = getUniqueItemRecords(normalizedLevel, vocabItems);
    const state = loadState();
    const levelProgress = state.progressByLevel?.[normalizedLevel] || {};
    const words = itemRecords.map((item) => {
        const progress = normalizeProgressEntry(item.entryKey, levelProgress[item.entryKey]);
        const attempts = progress.attempts;
        const correctCount = progress.correctCount;
        const wrongCount = progress.wrongCount;
        const accuracy = getAccuracy(progress);
        const status = classifyProgress(progress);
        const weakScore = (wrongCount * 3) - (correctCount * 2) + Math.max(0, 60 - accuracy);
        const strongScore = (correctCount * 3) - wrongCount + accuracy;

        return {
            entryKey: item.entryKey,
            itemId: item.itemId,
            word: item.word,
            meaning: item.meaning,
            attempts,
            correctCount,
            wrongCount,
            accuracy,
            status,
            lastAnsweredAt: progress.lastAnsweredAt,
            weakScore,
            strongScore,
        };
    });

    const counts = words.reduce((summary, word) => {
        summary[word.status] += 1;
        return summary;
    }, {
        unseen: 0,
        learning: 0,
        strong: 0,
        weak: 0,
    });

    const studiedWords = words.filter((word) => word.attempts > 0);
    const totalAttempts = studiedWords.reduce((sum, word) => sum + word.attempts, 0);
    const totalCorrect = studiedWords.reduce((sum, word) => sum + word.correctCount, 0);

    return {
        level: normalizedLevel,
        totalWords: words.length,
        studiedWords: studiedWords.length,
        counts,
        accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
        words,
        weakWords: words
            .filter((word) => word.status === 'weak')
            .sort((left, right) => right.weakScore - left.weakScore || right.wrongCount - left.wrongCount || left.word.localeCompare(right.word))
            .slice(0, 5),
        strongWords: words
            .filter((word) => word.status === 'strong')
            .sort((left, right) => right.strongScore - left.strongScore || right.correctCount - left.correctCount || left.word.localeCompare(right.word))
            .slice(0, 5),
    };
};

export const getStoredVocabLevelProgress = (level, { totalWords = 0 } = {}) => {
    const normalizedLevel = normalizeText(level);
    const state = loadState();
    const levelProgress = state.progressByLevel?.[normalizedLevel] || {};
    const words = Object.entries(levelProgress)
        .map(([entryKey, entry]) => {
            const progress = normalizeProgressEntry(entryKey, entry);
            const attempts = progress.attempts;
            const correctCount = progress.correctCount;
            const wrongCount = progress.wrongCount;
            const accuracy = getAccuracy(progress);
            const status = classifyProgress(progress);
            const weakScore = (wrongCount * 3) - (correctCount * 2) + Math.max(0, 60 - accuracy);
            const strongScore = (correctCount * 3) - wrongCount + accuracy;

            return {
                entryKey: progress.entryKey,
                itemId: progress.itemId,
                word: progress.word,
                meaning: progress.meaning,
                attempts,
                correctCount,
                wrongCount,
                accuracy,
                status,
                lastAnsweredAt: progress.lastAnsweredAt,
                weakScore,
                strongScore,
            };
        })
        .filter((word) => word.attempts > 0);

    const counts = words.reduce((summary, word) => {
        summary[word.status] += 1;
        return summary;
    }, {
        unseen: 0,
        learning: 0,
        strong: 0,
        weak: 0,
    });

    const totalAttempts = words.reduce((sum, word) => sum + word.attempts, 0);
    const totalCorrect = words.reduce((sum, word) => sum + word.correctCount, 0);
    counts.unseen = Math.max(0, Math.max(0, safeNumber(totalWords)) - words.length);

    return {
        level: normalizedLevel,
        totalWords: Math.max(0, safeNumber(totalWords)),
        studiedWords: words.length,
        counts,
        accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
        words,
        weakWords: words
            .filter((word) => word.status === 'weak')
            .sort((left, right) => right.weakScore - left.weakScore || right.wrongCount - left.wrongCount || left.word.localeCompare(right.word))
            .slice(0, 5),
        strongWords: words
            .filter((word) => word.status === 'strong')
            .sort((left, right) => right.strongScore - left.strongScore || right.correctCount - left.correctCount || left.word.localeCompare(right.word))
            .slice(0, 5),
    };
};

export const clearVocabStudyState = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }

    window.localStorage.removeItem(VOCAB_STUDY_STATE_STORAGE_KEY);
    touchCloudSaveData();
};
