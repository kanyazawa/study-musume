import { describe, expect, it } from 'vitest';
import { extractStructuredChatResponse } from '../../functions/_shared/chatService.js';

describe('chatService structured responses', () => {
    it('extracts reply and emotion from plain json', () => {
        expect(
            extractStructuredChatResponse('{"reply":"今日はよく頑張ったわ。","emotion":"happy"}')
        ).toEqual({
            reply: '今日はよく頑張ったわ。',
            emotion: 'happy',
        });
    });

    it('extracts reply and emotion from fenced json', () => {
        expect(
            extractStructuredChatResponse('```json\n{"reply":"その、ありがと。","emotion":"shy"}\n```')
        ).toEqual({
            reply: 'その、ありがと。',
            emotion: 'shy',
        });
    });

    it('falls back to plain text when the model does not return json', () => {
        expect(
            extractStructuredChatResponse('落ち着いていこう。深呼吸して。')
        ).toEqual({
            reply: '落ち着いていこう。深呼吸して。',
            emotion: 'normal',
        });
    });
});
