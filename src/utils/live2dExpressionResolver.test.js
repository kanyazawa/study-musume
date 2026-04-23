import { describe, expect, it } from 'vitest';
import {
    getEmotionAnimationProfile,
    getEmotionParameterProfile,
    getLive2DEmotionKey,
    resolveLive2DExpressionState,
    resolveMappedExpression,
} from './live2dExpressionResolver';

const modelConfig = {
    expressionMap: {
        angry: 'sq',
        happy: 'yj',
        normal: 'base',
        smile: 'yj',
    },
    emotionProfileMap: {
        angry: 'happy',
    },
};

describe('live2dExpressionResolver', () => {
    it('keeps model-specific expression ids behind the resolver', () => {
        expect(resolveMappedExpression(modelConfig, { emotion: 'happy' })).toBe('yj');
        expect(resolveMappedExpression(modelConfig, { emotion: 'angry' })).toBe('sq');
    });

    it('lets direct Live2D expressions override mapped emotion expressions', () => {
        expect(resolveMappedExpression(modelConfig, {
            emotion: 'happy',
            live2dExpression: 'zs1',
        })).toBe('zs1');

        expect(resolveMappedExpression(modelConfig, {
            emotion: 'happy',
            live2dExpression: 'none',
        })).toBe('');
    });

    it('suppresses exp3 where parameter-driven expressions should own the face', () => {
        expect(resolveMappedExpression(modelConfig, {
            emotion: 'normal',
            scene: 'home',
        })).toBe('');

        expect(resolveMappedExpression(modelConfig, {
            emotion: 'smile',
            scene: 'match',
        })).toBe('');
    });

    it('separates app emotion from model-specific parameter profiles', () => {
        expect(getLive2DEmotionKey({ emotion: 'angry' }, modelConfig)).toBe('happy');
        expect(getLive2DEmotionKey({
            emotion: 'angry',
            live2dEmotion: 'correct',
        }, modelConfig)).toBe('correct');
    });

    it('can disable parameter adjustments for expression-only previews', () => {
        const profile = getEmotionParameterProfile({
            emotion: 'happy',
            disableLive2DEmotionAdjustments: true,
        }, modelConfig);

        expect(profile.eyeSmile).toBe(0);
        expect(profile.eyeOpen).toBe(1);
        expect(profile.mouthOpen).toBe(0);
    });

    it('keeps review mistake mouth movement tightly limited', () => {
        const profile = getEmotionAnimationProfile({
            live2dEmotion: 'angry',
            scene: 'review',
            intensity: 0.9,
        }, modelConfig);

        expect(profile.mouthLimit).toBeLessThan(0.1);
        expect(profile.mouthFollowIn).toBeLessThan(0.1);
        expect(profile.mouthFollowOut).toBeGreaterThan(0.7);
    });

    it('resolves a single state object for viewer/runtime code', () => {
        const state = resolveLive2DExpressionState({
            emotion: 'happy',
            live2dFaceAccent: 'heart',
        }, modelConfig);

        expect(state.expression).toBe('yj');
        expect(state.faceAccent).toBe('heart');
        expect(state.parameterProfile.eyeSmile).toBeGreaterThan(0);
        expect(state.animationProfile.mouthScale).toBeGreaterThan(0);
    });
});
