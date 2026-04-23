import { describe, expect, it } from 'vitest';
import {
    EXPRESSION_LAYER,
    createExpressionLayer,
    resolveExpressionLayers,
} from './expressionLayers';

describe('expressionLayers', () => {
    it('merges active layers in priority order', () => {
        const resolved = resolveExpressionLayers({
            baseEmotion: 'normal',
            layers: [
                createExpressionLayer(EXPRESSION_LAYER.FEEDBACK, {
                    emotion: 'happy',
                    pose: { effect: 'glow' },
                }),
                createExpressionLayer(EXPRESSION_LAYER.REACTION, {
                    emotion: 'serious',
                    pose: { live2dFaceAccent: 'star' },
                }),
            ],
        });

        expect(resolved.emotion).toBe('happy');
        expect(resolved.emotionSource).toBe(EXPRESSION_LAYER.FEEDBACK);
        expect(resolved.pose.live2dFaceAccent).toBe('star');
        expect(resolved.pose.effect).toBe('glow');
    });

    it('drops expired layers', () => {
        const resolved = resolveExpressionLayers({
            baseEmotion: 'normal',
            nowMs: 2000,
            layers: [
                createExpressionLayer(EXPRESSION_LAYER.FEEDBACK, {
                    emotion: 'happy',
                    expiresAt: 1000,
                }),
            ],
        });

        expect(resolved.emotion).toBe('normal');
        expect(resolved.activeLayers).toHaveLength(1);
    });

    it('normalizes emotions at the scene boundary', () => {
        const resolved = resolveExpressionLayers({
            baseEmotion: 'smile',
            normalizeEmotion: (emotion) => emotion === 'smile' ? 'happy' : emotion,
        });

        expect(resolved.emotion).toBe('happy');
        expect(resolved.pose.emotion).toBe('happy');
    });
});
