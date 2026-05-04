import { beforeEach, describe, expect, it } from 'vitest';
import {
    __resetChatGatewayForTests,
    enforceChatGatewayAccess,
    getChatClientIdentifier,
    getChatGatewayConfig,
    isChatEnabled,
} from '../../functions/_shared/chatGateway.js';

describe('chatGateway', () => {
    beforeEach(() => {
        __resetChatGatewayForTests();
    });

    it('treats CHAT_ENABLED as enabled by default and false when explicitly disabled', () => {
        expect(isChatEnabled(undefined)).toBe(true);
        expect(isChatEnabled('false')).toBe(false);
        expect(getChatGatewayConfig({ CHAT_ENABLED: '0' }).enabled).toBe(false);
    });

    it('prefers explicit client identifiers over forwarded IP addresses', () => {
        expect(getChatClientIdentifier({
            body: {
                userId: 'user-123',
                anonymousId: 'anon-ignored',
            },
            headers: {
                'x-forwarded-for': '203.0.113.1, 203.0.113.2',
            },
        })).toBe('user-123');

        expect(getChatClientIdentifier({
            body: {},
            headers: {
                'x-forwarded-for': '203.0.113.1, 203.0.113.2',
            },
        })).toBe('203.0.113.1');
    });

    it('returns a disabled response when chat is turned off', () => {
        const result = enforceChatGatewayAccess({
            env: {
                CHAT_ENABLED: 'off',
            },
            body: {
                anonymousId: 'anon-1',
            },
        });

        expect(result).toMatchObject({
            ok: false,
            statusCode: 503,
            body: {
                code: 'chat_disabled',
            },
        });
    });

    it('blocks rapid follow-up requests from the same client', () => {
        const now = 1000;
        const first = enforceChatGatewayAccess({
            env: {
                CHAT_GATEWAY_COOLDOWN_MS: '2500',
            },
            body: {
                anonymousId: 'anon-1',
            },
            now,
        });
        const second = enforceChatGatewayAccess({
            env: {
                CHAT_GATEWAY_COOLDOWN_MS: '2500',
            },
            body: {
                anonymousId: 'anon-1',
            },
            now: now + 1200,
        });

        expect(first.ok).toBe(true);
        expect(second).toMatchObject({
            ok: false,
            statusCode: 429,
            body: {
                code: 'chat_cooldown',
            },
        });
        expect(second.body.retryAfterMs).toBe(1300);
    });

    it('allows another request after the cooldown expires', () => {
        const now = new Date('2026-05-04T15:10:00+09:00').getTime();

        enforceChatGatewayAccess({
            body: {
                anonymousId: 'anon-1',
            },
            now,
        });
        const next = enforceChatGatewayAccess({
            body: {
                anonymousId: 'anon-1',
            },
            now: now + 3000,
        });

        expect(next.ok).toBe(true);
    });
});
