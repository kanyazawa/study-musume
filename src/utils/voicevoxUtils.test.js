import { describe, expect, it } from 'vitest';
import { buildSpeechVariationProfile } from './voicevoxUtils';

describe('buildSpeechVariationProfile', () => {
    it('makes excited lines livelier than serious paused lines', () => {
        const excited = buildSpeechVariationProfile('やった！ 本当にうれしい！', {
            emotion: 'happy',
            browserPitch: 1.2,
            browserRate: 1.0,
        });
        const serious = buildSpeechVariationProfile('……落ち着いて、ここは慎重にいこう。', {
            emotion: 'serious',
            browserPitch: 1.2,
            browserRate: 1.0,
        });

        expect(excited.browser.pitch).toBeGreaterThan(serious.browser.pitch);
        expect(excited.engine.audioQueryOverrides.intonationScale).toBeGreaterThan(
            serious.engine.audioQueryOverrides.intonationScale
        );
        expect(excited.engine.audioQueryOverrides.speedScale).toBeGreaterThan(
            serious.engine.audioQueryOverrides.speedScale
        );
    });

    it('respects explicit browser overrides while keeping a stable cache signature', () => {
        const first = buildSpeechVariationProfile('同じセリフ', {
            emotion: 'normal',
            browserPitch: 1.2,
            browserRate: 1.0,
            pitchOverride: 1.45,
            rateOverride: 0.92,
            seedHint: 'line-1',
        });
        const second = buildSpeechVariationProfile('同じセリフ', {
            emotion: 'normal',
            browserPitch: 1.2,
            browserRate: 1.0,
            pitchOverride: 1.45,
            rateOverride: 0.92,
            seedHint: 'line-1',
        });

        expect(first.browser.pitch).toBe(1.45);
        expect(first.browser.rate).toBe(0.92);
        expect(first.signature).toBe(second.signature);
    });
});
