import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearVocabStudyState,
    getNextVocabBatchForLevel,
    getVocabLevelProgress,
    recordVocabAttempt,
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

    it('clears saved cycle and progress state', () => {
        getNextVocabBatchForLevel('grade5', vocabItems, 2);
        recordVocabAttempt({ level: 'grade5', word: 'apple', meaning: 'りんご', isCorrect: true });

        clearVocabStudyState();

        expect(localStorage.getItem('vocabStudyState')).toBeNull();
    });
});
