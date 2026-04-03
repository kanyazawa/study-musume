import { beforeEach, describe, expect, it } from 'vitest';
import { __resetReactionMemoryForTests, getHomeReaction, getQuizReaction } from './affectionUtils';

describe('affectionUtils reaction variety', () => {
    beforeEach(() => {
        __resetReactionMemoryForTests();
    });

    it('avoids repeating the exact same home reaction twice in a row', () => {
        const first = getHomeReaction({
            affection: 0,
            tp: 100,
            maxTp: 100,
            loginStreak: 0,
            characterId: 'noah',
        });
        const second = getHomeReaction({
            affection: 0,
            tp: 100,
            maxTp: 100,
            loginStreak: 0,
            characterId: 'noah',
        });

        expect(first.text).not.toBe(second.text);
    });

    it('avoids repeating the same quiz reaction consecutively within the same bucket', () => {
        const first = getQuizReaction({
            characterId: 'ren',
            affection: 0,
            isCorrect: true,
            streak: 0,
        });
        const second = getQuizReaction({
            characterId: 'ren',
            affection: 0,
            isCorrect: true,
            streak: 0,
        });

        expect(first.text).not.toBe(second.text);
    });
});
