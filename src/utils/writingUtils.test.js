import { beforeEach, describe, expect, it } from 'vitest';
import {
    countEnglishWords,
    getWritingDraft,
    getWritingHistory,
    getWritingSummary,
    saveWritingDraft,
    saveWritingResult,
} from './writingUtils';

describe('writingUtils', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('counts english words with apostrophes and hyphens', () => {
        expect(countEnglishWords("I'm writing a well-known answer.")).toBe(5);
    });

    it('stores history in reverse chronological order', () => {
        saveWritingResult({
            promptId: 'older',
            evaluatedAt: 100,
            evaluation: { overallScore: 8 },
        });
        saveWritingResult({
            promptId: 'newer',
            evaluatedAt: 200,
            evaluation: { overallScore: 12 },
        });

        const history = getWritingHistory();

        expect(history).toHaveLength(2);
        expect(history[0].promptId).toBe('newer');
        expect(history[1].promptId).toBe('older');
        expect(getWritingSummary(history)).toEqual({
            attempts: 2,
            averageScore: 10,
            bestScore: 12,
        });
    });

    it('stores drafts by prompt id', () => {
        saveWritingDraft('prompt-a', 'First draft');
        saveWritingDraft('prompt-b', 'Second draft');

        expect(getWritingDraft('prompt-a')).toBe('First draft');
        expect(getWritingDraft('prompt-b')).toBe('Second draft');
    });
});
