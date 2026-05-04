import { describe, expect, it, vi } from 'vitest';
import {
    applyCharacterEvaluationResult,
    getCharacterEvaluationSummary,
} from './characterEvaluationUtils';

describe('characterEvaluationUtils', () => {
    it('starts from the default evaluation tier', () => {
        const summary = getCharacterEvaluationSummary({ characterId: 'noah' });

        expect(summary.rank).toBe('D');
        expect(summary.label).toBe('まだ様子見');
        expect(summary.pointsToNext).toBeGreaterThanOrEqual(0);
    });

    it('raises evaluation after a strong completed session', () => {
        vi.spyOn(Date, 'now').mockReturnValue(1777777777000);

        const result = applyCharacterEvaluationResult({
            characterId: 'noah',
        }, {
            activityType: 'study',
            answeredCount: 10,
            correctCount: 10,
            completed: true,
            durationMinutes: 12,
            perfect: true,
        });

        const summary = getCharacterEvaluationSummary(result.nextStats, 'noah');
        expect(result.delta).toBeGreaterThan(0);
        expect(summary.score).toBeGreaterThan(0);
        expect(summary.rank).toBe('C');
        expect(result.reactionText.length).toBeGreaterThan(0);
    });

    it('keeps evaluations per character', () => {
        const noahStats = applyCharacterEvaluationResult({
            characterId: 'noah',
        }, {
            activityType: 'study',
            answeredCount: 8,
            correctCount: 7,
            completed: true,
        }).nextStats;

        const renStats = applyCharacterEvaluationResult({
            ...noahStats,
            characterId: 'ren',
        }, {
            activityType: 'battle',
            answeredCount: 10,
            correctCount: 2,
            completed: true,
        }).nextStats;

        expect(getCharacterEvaluationSummary(renStats, 'noah').score).toBeGreaterThan(0);
        expect(getCharacterEvaluationSummary(renStats, 'ren').score).toBeLessThanOrEqual(5);
    });
});
