import { describe, expect, it } from 'vitest';
import {
    HOME_EXPRESSION_LAYER,
    createHomeExpressionLayer,
    resolveHomeExpressionLayers,
    toVisibleHomeEmotion,
} from './homeExpressionLayers';

describe('homeExpressionLayers', () => {
    it('normalizes static-only emotions to visible Home emotions', () => {
        expect(toVisibleHomeEmotion('smile')).toBe('happy');
        expect(toVisibleHomeEmotion('sad')).toBe('serious');
        expect(toVisibleHomeEmotion('normal')).toBe('normal');
    });

    it('infers a serious base expression when TP is low', () => {
        const resolved = resolveHomeExpressionLayers({
            baseEmotion: 'normal',
            tp: 20,
            maxTp: 100,
        });

        expect(resolved.emotion).toBe('serious');
        expect(resolved.emotionSource).toBe(HOME_EXPRESSION_LAYER.BASE);
    });

    it('keeps reaction pose metadata while letting user input emotion win', () => {
        const resolved = resolveHomeExpressionLayers({
            baseEmotion: 'happy',
            speech: 'ありがとう',
            layers: [
                createHomeExpressionLayer(HOME_EXPRESSION_LAYER.REACTION, {
                    emotion: 'angry',
                    pose: {
                        live2dFaceAccent: 'shy',
                        live2dExpression: 'none',
                    },
                }),
                createHomeExpressionLayer(HOME_EXPRESSION_LAYER.USER_INPUT, {
                    emotion: 'serious',
                }),
            ],
        });

        expect(resolved.emotion).toBe('serious');
        expect(resolved.emotionSource).toBe(HOME_EXPRESSION_LAYER.USER_INPUT);
        expect(resolved.pose.live2dFaceAccent).toBe('shy');
        expect(resolved.pose.live2dExpression).toBe('none');
    });

    it('adds impact motion without taking over the facial emotion', () => {
        const resolved = resolveHomeExpressionLayers({
            baseEmotion: 'happy',
            layers: [
                createHomeExpressionLayer(HOME_EXPRESSION_LAYER.IMPACT, {
                    pose: {
                        live2dImpactMotion: 'chest-flinch',
                        live2dImpactDurationMs: 900,
                    },
                }),
            ],
        });

        expect(resolved.emotion).toBe('happy');
        expect(resolved.pose.live2dImpactMotion).toBe('chest-flinch');
        expect(resolved.pose.live2dImpactDurationMs).toBe(900);
    });

    it('drops expired temporary layers', () => {
        const resolved = resolveHomeExpressionLayers({
            baseEmotion: 'normal',
            tp: 100,
            maxTp: 100,
            nowMs: 2000,
            layers: [
                createHomeExpressionLayer(HOME_EXPRESSION_LAYER.USER_INPUT, {
                    emotion: 'happy',
                    expiresAt: 1000,
                }),
            ],
        });

        expect(resolved.emotion).toBe('normal');
        expect(resolved.activeLayers).toHaveLength(1);
    });
});
