import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    addCustomVocabEntry,
    getCustomVocabEntries,
    getCustomVocabStudyItems,
    removeCustomVocabEntry,
} from './customVocabUtils';

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
});
