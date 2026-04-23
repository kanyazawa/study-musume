import { describe, expect, it } from 'vitest';
import { getMatchFaceAccent, resolveMatchCharacterPose } from './matchExpressionState';

describe('matchExpressionState', () => {
    it('returns face accents from match feedback and persistent emotion', () => {
        expect(getMatchFaceAccent({ answerFx: 'wrong' })).toBe('angry');
        expect(getMatchFaceAccent({ answerFx: 'correct', correctStreak: 1 })).toBe('star');
        expect(getMatchFaceAccent({ answerFx: 'correct', correctStreak: 2 })).toBe('heart');
        expect(getMatchFaceAccent({ persistentEmotion: 'happy' })).toBe('heart');
    });

    it('builds a glowing Live2D correct pose', () => {
        const { matchPose, matchFaceAccent } = resolveMatchCharacterPose({
            answerFx: 'correct',
            correctStreak: 2,
            matchEmotion: 'happy',
        });

        expect(matchPose.emotion).toBe('happy');
        expect(matchPose.expression).toBe('smile');
        expect(matchPose.live2dEmotion).toBe('smile');
        expect(matchPose.live2dExpression).toBe('yj');
        expect(matchPose.effect).toBe('glow');
        expect(matchFaceAccent).toBe('heart');
    });

    it('builds an angry wrong-answer pose', () => {
        const { matchPose, matchFaceAccent } = resolveMatchCharacterPose({
            answerFx: 'wrong',
            matchEmotion: 'normal',
        });

        expect(matchPose.emotion).toBe('angry');
        expect(matchPose.effect).toBe('shake');
        expect(matchPose.live2dFaceAccent).toBe(null);
        expect(matchFaceAccent).toBe('angry');
    });

    it('uses match-result scene on result phase', () => {
        const { matchPose } = resolveMatchCharacterPose({
            matchEmotion: 'serious',
            phase: 'result',
        });

        expect(matchPose.scene).toBe('match-result');
    });
});
