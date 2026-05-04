import { describe, expect, it, vi } from 'vitest';
import { buildReorderPracticeQuestions } from './reorderPracticeQuestions';

describe('reorderPracticeQuestions', () => {
    it('builds reorder quiz questions with token arrays', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-02T10:00:00.000Z'));

        const questions = buildReorderPracticeQuestions();

        expect(questions.length).toBeGreaterThanOrEqual(5);
        expect(questions[0]).toEqual(expect.objectContaining({
            subject: '英語 並び替え',
            questionType: 'reorder',
            correctAnswer: expect.any(String),
            tokens: expect.any(Array),
        }));
        expect(questions.every((question) => question.tokens.length >= 4)).toBe(true);
        expect(questions.every((question) => question.questionText.includes('並び替え'))).toBe(true);

        vi.useRealTimers();
    });
});

