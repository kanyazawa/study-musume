import { describe, expect, it } from 'vitest';
import { getVoiceFallbackCandidates, toLocalAudioPath } from './voicePathUtils';

describe('voicePathUtils', () => {
    it('keeps explicit /audio paths untouched', () => {
        expect(toLocalAudioPath('/audio/tts-generated/home-reactions/emma/emma-default-01.mp3')).toBe(
            '/audio/tts-generated/home-reactions/emma/emma-default-01.mp3',
        );
    });

    it('builds a Noah fallback candidate for Emma voice paths', () => {
        expect(getVoiceFallbackCandidates('tts-generated/home-touch/emma/face/emma-face-01.mp3')).toEqual([
            'tts-generated/home-touch/emma/face/emma-face-01.mp3',
            'tts-generated/home-touch/noah/face/noah-face-01.mp3',
        ]);
    });

    it('does not add fallback candidates for non-Emma paths', () => {
        expect(getVoiceFallbackCandidates('tts-generated/home-reactions/ren/ren-default-01.mp3')).toEqual([
            'tts-generated/home-reactions/ren/ren-default-01.mp3',
        ]);
    });
});
