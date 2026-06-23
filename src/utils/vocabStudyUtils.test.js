import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearVocabStudyState,
    getFlashcardScheduleChoices,
    getNextFlashcardVocabBatchForLevel,
    getStoredVocabLevelProgress,
    getNextVocabBatchForLevel,
    getVocabLevelProgress,
    recordVocabAttempt,
    recordVocabFlashcardSchedule,
} from './vocabStudyUtils';

describe('vocabStudyUtils', () => {
    const vocabItems = [
        { word: 'apple', meaning: 'りんご' },
        { word: 'book', meaning: '本' },
        { word: 'cat', meaning: '猫' },
        { word: 'dog', meaning: '犬' },
    ];

    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('does not repeat words until a level cycle is completed', () => {
        const firstBatch = getNextVocabBatchForLevel('grade5', vocabItems, 2);
        const secondBatch = getNextVocabBatchForLevel('grade5', vocabItems, 2);
        const firstLapWords = [...firstBatch, ...secondBatch].map((item) => item.word);

        expect(firstBatch).toHaveLength(2);
        expect(secondBatch).toHaveLength(2);
        expect(new Set(firstLapWords).size).toBe(4);

        const thirdBatch = getNextVocabBatchForLevel('grade5', vocabItems, 2);

        expect(thirdBatch).toHaveLength(2);
    });

    it('summarizes strong, weak, learning, and unseen words by level', () => {
        recordVocabAttempt({ level: 'grade5', word: 'apple', meaning: 'りんご', isCorrect: true });
        recordVocabAttempt({ level: 'grade5', word: 'apple', meaning: 'りんご', isCorrect: true });
        recordVocabAttempt({ level: 'grade5', word: 'dog', meaning: '犬', isCorrect: false });
        recordVocabAttempt({ level: 'grade5', word: 'dog', meaning: '犬', isCorrect: false });
        recordVocabAttempt({ level: 'grade5', word: 'book', meaning: '本', isCorrect: true });

        const summary = getVocabLevelProgress('grade5', vocabItems);

        expect(summary.totalWords).toBe(4);
        expect(summary.studiedWords).toBe(3);
        expect(summary.counts.strong).toBe(1);
        expect(summary.counts.weak).toBe(1);
        expect(summary.counts.learning).toBe(1);
        expect(summary.counts.unseen).toBe(1);
        expect(summary.weakWords[0]).toEqual(expect.objectContaining({ word: 'dog' }));
        expect(summary.strongWords[0]).toEqual(expect.objectContaining({ word: 'apple' }));
    });

    it('builds a stats summary from stored progress without the full vocab list', () => {
        recordVocabAttempt({ level: 'grade5', word: 'apple', meaning: 'りんご', isCorrect: true });
        recordVocabAttempt({ level: 'grade5', word: 'apple', meaning: 'りんご', isCorrect: true });
        recordVocabAttempt({ level: 'grade5', word: 'dog', meaning: '犬', isCorrect: false });
        recordVocabAttempt({ level: 'grade5', word: 'book', meaning: '本', isCorrect: true });

        const summary = getStoredVocabLevelProgress('grade5', { totalWords: 4 });

        expect(summary.totalWords).toBe(4);
        expect(summary.studiedWords).toBe(3);
        expect(summary.counts.strong).toBe(1);
        expect(summary.counts.weak).toBe(0);
        expect(summary.counts.learning).toBe(2);
        expect(summary.counts.unseen).toBe(1);
        expect(summary.strongWords[0]).toEqual(expect.objectContaining({ word: 'apple' }));
    });

    it('clears saved cycle and progress state', () => {
        getNextVocabBatchForLevel('grade5', vocabItems, 2);
        recordVocabAttempt({ level: 'grade5', word: 'apple', meaning: 'りんご', isCorrect: true });

        clearVocabStudyState();

        expect(localStorage.getItem('vocabStudyState')).toBeNull();
    });

    it('saves flashcard scheduling and deprioritizes the card until later', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2023-11-14T12:00:00.000Z'));

        const tomorrowChoice = getFlashcardScheduleChoices().find((choice) => choice.label === '明日');

        recordVocabFlashcardSchedule({
            level: 'grade5',
            word: 'apple',
            meaning: 'りんご',
            scheduleChoice: tomorrowChoice,
        });

        const nextBatch = getNextFlashcardVocabBatchForLevel('grade5', vocabItems, 2);

        expect(nextBatch.some((item) => item.word === 'apple')).toBe(false);

        vi.useRealTimers();
    });

    it('removes flashcard-retired words from later flashcard batches', () => {
        const retireChoice = getFlashcardScheduleChoices().find((choice) => choice.complete);

        recordVocabFlashcardSchedule({
            level: 'grade5',
            word: 'apple',
            meaning: 'りんご',
            scheduleChoice: retireChoice,
        });

        const nextBatch = getNextFlashcardVocabBatchForLevel('grade5', vocabItems, 4);

        expect(nextBatch.some((item) => item.word === 'apple')).toBe(false);
    });
});
