import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    buildQuestionOptions,
    getNthCorrectAnswerTimestamp,
    resolveWinnerUid,
    summarizeAnswers,
    shuffleArray,
} from './matchUtils';

describe('matchUtils', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('builds answer options without duplicate meanings', () => {
        const options = buildQuestionOptions('結果', ['結果', '分析', '結果', '提案', '集中', '分析']);

        expect(options).toContain('結果');
        expect(options).toHaveLength(4);
        expect(new Set(options).size).toBe(4);
    });

    it('keeps all items when shuffling', () => {
        vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.1)
            .mockReturnValueOnce(0.7)
            .mockReturnValueOnce(0.4);

        expect(shuffleArray(['a', 'b', 'c', 'd']).sort()).toEqual(['a', 'b', 'c', 'd']);
    });

    it('finds the timestamp of the target correct answer', () => {
        const timestamp = getNthCorrectAnswerTimestamp([
            { isCorrect: false, timestamp: 10 },
            { isCorrect: true, timestamp: 30 },
            { isCorrect: true, timestamp: 20 },
            { isCorrect: true, timestamp: 40 },
        ], 2);

        expect(timestamp).toBe(30);
    });

    it('summarizes answered questions and rounds accuracy', () => {
        expect(summarizeAnswers([
            { isCorrect: true },
            { isCorrect: false },
            { isCorrect: true },
        ])).toEqual({
            answeredCount: 3,
            correctCount: 2,
            accuracy: 67,
        });
    });

    it('prefers the player who reached the target score first when scores tie', () => {
        const roomData = {
            player1: {
                uid: 'p1',
                score: 10,
                answers: Array.from({ length: 10 }, (_, index) => ({
                    isCorrect: true,
                    timestamp: index + 1,
                })),
            },
            player2: {
                uid: 'p2',
                score: 10,
                answers: Array.from({ length: 10 }, (_, index) => ({
                    isCorrect: true,
                    timestamp: index + 11,
                })),
            },
        };

        expect(resolveWinnerUid(roomData, 10)).toBe('p1');
    });

    it('returns draw when both score and target timing are tied', () => {
        const answers = Array.from({ length: 10 }, (_, index) => ({
            isCorrect: true,
            timestamp: index + 1,
        }));

        expect(resolveWinnerUid({
            player1: { uid: 'p1', score: 10, answers },
            player2: { uid: 'p2', score: 10, answers },
        }, 10)).toBeNull();
    });
});
