import { describe, expect, it } from 'vitest';
import { buildChatLogEntry } from '../../functions/_shared/chatLogging.js';

describe('chatLogging', () => {
    it('builds a compact log entry for successful model replies', () => {
        const entry = buildChatLogEntry({
            transport: 'worker',
            clientId: 'anon-1234567890',
            body: {
                message: '今日はちょっと疲れた',
                recentMessages: [{ role: 'user', content: 'やあ' }],
            },
            result: {
                statusCode: 200,
                body: {
                    provider: 'openai',
                    model: 'gpt-5-nano',
                    usage: {
                        input_tokens: 22,
                        output_tokens: 10,
                        total_tokens: 32,
                    },
                },
            },
        });

        expect(entry).toMatchObject({
            route: 'chat',
            transport: 'worker',
            clientIdHint: '34567890',
            inputLength: '今日はちょっと疲れた'.length,
            recentMessageCount: 1,
            blocked: false,
            provider: 'openai',
            model: 'gpt-5-nano',
            usage: {
                promptTokens: 22,
                completionTokens: 10,
                totalTokens: 32,
            },
            error: null,
            statusCode: 200,
        });
    });

    it('keeps blocked and error metadata when present', () => {
        const entry = buildChatLogEntry({
            transport: 'pages-function',
            clientId: 'anon-1',
            body: {
                message: '死にたい',
            },
            result: {
                statusCode: 200,
                body: {
                    blocked: true,
                    safetyCategory: 'self_harm',
                    provider: 'safety',
                    model: 'rule-based',
                },
            },
            error: new Error('upstream failed'),
        });

        expect(entry).toMatchObject({
            blocked: true,
            safetyCategory: 'self_harm',
            error: 'upstream failed',
            provider: 'safety',
            model: 'rule-based',
        });
    });
});
