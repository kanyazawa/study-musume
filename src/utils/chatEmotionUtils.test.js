import { describe, expect, it } from 'vitest';
import { inferEmotionFromChatText } from './chatEmotionUtils';

describe('chatEmotionUtils', () => {
    it('detects positive assistant replies as happy', () => {
        expect(inferEmotionFromChatText('ありがとう、すごく嬉しい。', { role: 'assistant' })).toBe('happy');
    });

    it('detects shy assistant replies', () => {
        expect(inferEmotionFromChatText('べ、別に嬉しくなんてないけど、その、ありがと。', { role: 'assistant' })).toBe('shy');
    });

    it('detects serious user messages when they sound exhausted', () => {
        expect(inferEmotionFromChatText('今日はちょっと疲れたし無理かも', { role: 'user' })).toBe('serious');
    });

    it('detects angry user messages', () => {
        expect(inferEmotionFromChatText('ほんと最悪、うるさい', { role: 'user' })).toBe('angry');
    });
});
