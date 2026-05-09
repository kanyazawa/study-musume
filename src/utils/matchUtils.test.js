import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    buildQuestionOptions,
    clampTugPosition,
    FRIEND_MATCH_MODE_OPTIONS,
    FRIEND_MATCH_TARGET_OPTIONS,
    getBattleModeLabel,
    getNthCorrectAnswerTimestamp,
    getTugPushAmount,
    normalizeBattleMode,
    normalizeTargetCorrect,
    resolveTugAdvantageMeta,
    resolveTugMomentumEvent,
    resolveWinnerUid,
    summarizeAnswers,
    shuffleArray,
    TUG_GAUGE_LIMIT,
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

    it('normalizes friend target settings to supported values', () => {
        expect(FRIEND_MATCH_TARGET_OPTIONS).toEqual([5, 10, 15, 20]);
        expect(normalizeTargetCorrect('15')).toBe(15);
        expect(normalizeTargetCorrect(99)).toBe(10);
    });

    it('normalizes friend battle modes and returns labels', () => {
        expect(FRIEND_MATCH_MODE_OPTIONS).toEqual(['classic', 'listening']);
        expect(normalizeBattleMode('listening')).toBe('listening');
        expect(normalizeBattleMode('ranked')).toBe('classic');
        expect(getBattleModeLabel('listening')).toBe('リスニング');
    });

    it('returns tug push amounts with streak scaling and clamps gauge positions', () => {
        expect(getTugPushAmount(1)).toBe(10);
        expect(getTugPushAmount(2)).toBe(12);
        expect(getTugPushAmount(3)).toBe(15);
        expect(getTugPushAmount(8)).toBe(18);
        expect(clampTugPosition(180)).toBe(TUG_GAUGE_LIMIT);
        expect(clampTugPosition(-180)).toBe(-TUG_GAUGE_LIMIT);
    });

    it('describes tug advantage from each player perspective', () => {
        expect(resolveTugAdvantageMeta(0)).toMatchObject({ label: '拮抗', tone: 'neutral' });
        expect(resolveTugAdvantageMeta(28)).toMatchObject({ label: '優勢', tone: 'lead' });
        expect(resolveTugAdvantageMeta(70, 'player2')).toMatchObject({ label: '大劣勢', tone: 'chase' });
    });

    it('detects lead changes, comebacks, and pressure moments', () => {
        expect(resolveTugMomentumEvent({
            previousPosition: -14,
            nextPosition: 8,
            actingPlayer: 'player1',
            isCorrect: true,
            streak: 2,
        })).toMatchObject({ type: 'lead_change', label: '逆転！' });

        expect(resolveTugMomentumEvent({
            previousPosition: -52,
            nextPosition: -37,
            actingPlayer: 'player1',
            isCorrect: true,
            streak: 3,
        })).toMatchObject({ type: 'comeback', label: '押し返した！' });

        expect(resolveTugMomentumEvent({
            previousPosition: 18,
            nextPosition: 36,
            actingPlayer: 'player1',
            isCorrect: true,
            streak: 4,
        })).toMatchObject({ type: 'dominating', label: 'DOMINATING' });
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

    it('prefers tug position over score when gauge battle data exists', () => {
        expect(resolveWinnerUid({
            finishReason: 'questions_exhausted',
            tugPosition: -18,
            player1: { uid: 'p1', score: 8, answers: [] },
            player2: { uid: 'p2', score: 7, answers: [] },
        }, 10)).toBe('p2');
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
