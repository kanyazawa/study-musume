import { describe, expect, it } from 'vitest';
import { resolveReviewCharacterPose } from './reviewExpressionState';

describe('reviewExpressionState', () => {
    it('uses a neutral Live2D base pose before feedback', () => {
        const { characterPose, visibleReviewFaceAccent } = resolveReviewCharacterPose({
            renderer: 'live2d',
            wrongCount: 4,
            priority: 'urgent',
        });

        expect(characterPose.emotion).toBe('normal');
        expect(characterPose.scene).toBe('review');
        expect(visibleReviewFaceAccent).toBe(null);
    });

    it('promotes correct feedback to a speaking correct pose', () => {
        const { characterPose, reviewFaceAccent } = resolveReviewCharacterPose({
            renderer: 'live2d',
            feedback: 'correct',
            correctStreak: 2,
        });

        expect(characterPose.emotion).toBe('correct');
        expect(characterPose.live2dEmotion).toBe('correct');
        expect(characterPose.speaking).toBe(true);
        expect(characterPose.effect).toBe('glow');
        expect(reviewFaceAccent).toBe('heart');
    });

    it('turns incorrect feedback into an angry shake pose', () => {
        const { characterPose, reviewFaceAccent } = resolveReviewCharacterPose({
            feedback: 'incorrect',
            persistentEmotion: 'angry',
        });

        expect(characterPose.emotion).toBe('angry');
        expect(characterPose.effect).toBe('shake');
        expect(characterPose.live2dFaceAccent).toBe(null);
        expect(reviewFaceAccent).toBe(null);
    });
});
