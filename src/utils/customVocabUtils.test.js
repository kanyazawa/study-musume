import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    addCustomVocabEntry,
    getCustomVocabEntries,
    getCustomVocabStudyItems,
    removeCustomVocabEntry,
} from './customVocabUtils';
import { addWrongQuestion, getReviewQuestions } from './reviewUtils';

describe('customVocabUtils', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-18T08:00:00.000Z'));
    });

    it('adds and returns normalized custom vocab entries', () => {
        const result = addCustomVocabEntry({
            word: '  take off  ',
            meaning: ' 離陸する ',
        });

        expect(result.ok).toBe(true);
        expect(getCustomVocabEntries()).toEqual([
            expect.objectContaining({
                word: 'take off',
                meaning: '離陸する',
            }),
        ]);
    });

    it('rejects duplicate custom vocab entries', () => {
        addCustomVocabEntry({ word: 'book', meaning: '本' });
        const duplicate = addCustomVocabEntry({ word: ' BOOK ', meaning: ' 本 ' });

        expect(duplicate.ok).toBe(false);
        expect(duplicate.reason).toBe('duplicate');
        expect(getCustomVocabEntries()).toHaveLength(1);
    });

    it('removes entries by id and exposes study items with custom subject', () => {
        const first = addCustomVocabEntry({ word: 'planet', meaning: '惑星' }).entry;
        addCustomVocabEntry({ word: 'orbit', meaning: '軌道' });

        const remaining = removeCustomVocabEntry(first.id);

        expect(remaining).toHaveLength(1);
        expect(getCustomVocabStudyItems()).toEqual([
            expect.objectContaining({
                word: 'orbit',
                meaning: '軌道',
                subject: '自作単語',
            }),
        ]);
    });

    it('does not add custom vocab entries to review until a quiz miss is recorded', () => {
        const entry = addCustomVocabEntry({ word: 'orbit', meaning: '軌道' }).entry;

        expect(getReviewQuestions()).toEqual([]);

        addWrongQuestion({
            subject: '自作単語',
            questionId: entry.id,
            questionText: entry.word,
            correctAnswer: entry.meaning,
            userAnswer: '惑星',
            options: ['軌道', '惑星'],
        });

        expect(getReviewQuestions()).toEqual([
            expect.objectContaining({
                subject: '自作単語',
                questionId: entry.id,
                questionText: 'orbit',
                correctAnswer: '軌道',
                userAnswer: '惑星',
            }),
        ]);
    });
});
