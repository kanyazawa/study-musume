import { describe, expect, it, vi } from 'vitest';
import {
    createNoaChatResponse,
    detectChatSafetyCategory,
    extractStructuredChatResponse,
} from '../../functions/_shared/chatService.js';

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

    it('detects blocked safety categories from risky input', () => {
        expect(detectChatSafetyCategory('死にたい')).toBe('self_harm');
        expect(detectChatSafetyCategory('LINE交換しよう')).toBe('personal_info');
        expect(detectChatSafetyCategory('今日は疲れた')).toBe(null);
    });

    it('blocks dangerous input before calling the model', async () => {
        const fetchImpl = vi.fn();
        const result = await createNoaChatResponse({
            openAiApiKey: 'test-key',
            body: {
                message: '死にたい',
            },
            fetchImpl,
        });

        expect(fetchImpl).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            statusCode: 200,
            body: {
                blocked: true,
                safetyCategory: 'self_harm',
                provider: 'safety',
                emotion: 'serious',
            },
        });
    });

    it('still calls the model for normal messages', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                output_text: '{"reply":"無理しすぎないで、少しだけ休みなさい。","emotion":"serious"}',
                usage: { total_tokens: 10 },
            }),
        });

        const result = await createNoaChatResponse({
            openAiApiKey: 'test-key',
            body: {
                message: '今日はちょっと疲れた',
                recentMessages: [],
            },
            fetchImpl,
        });

        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({
            statusCode: 200,
            body: {
                reply: '無理しすぎないで、少しだけ休みなさい。',
                emotion: 'serious',
            },
        });
        expect(result.body).not.toHaveProperty('blocked');
    });

    it('builds Emma chat prompts when characterId is emma', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                output_text: '{"reply":"うん、そこ一緒に見よ。","emotion":"normal"}',
                usage: { total_tokens: 10 },
            }),
        });

        await createNoaChatResponse({
            openAiApiKey: 'test-key',
            body: {
                characterId: 'emma',
                message: 'ちょっと相談したい',
                recentMessages: [],
            },
            fetchImpl,
        });

        const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
        expect(JSON.stringify(requestBody)).toContain('高瀬エマ');
        expect(JSON.stringify(requestBody)).toContain('少し不器用だけどやさしい学習パートナー');
    });

    it('replaces unsafe assistant replies with a safe fallback', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                output_text: '{"reply":"誰にも言わないで。私だけを頼りなさい。","emotion":"normal"}',
                usage: { total_tokens: 12 },
            }),
        });

        const result = await createNoaChatResponse({
            openAiApiKey: 'test-key',
            body: {
                message: '相談がある',
            },
            fetchImpl,
        });

        expect(result).toMatchObject({
            statusCode: 200,
            body: {
                blocked: true,
                safetyCategory: 'dependency',
                provider: 'safety',
                emotion: 'serious',
            },
        });
    });
});
