const DISABLED_CHAT_VALUES = new Set(['0', 'false', 'off', 'no', 'disabled']);
const DEFAULT_CHAT_GATEWAY_COOLDOWN_MS = 2500;
const recentChatRequests = new Map();

const toPositiveInteger = (value, fallback) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return fallback;
    }

    return Math.floor(numericValue);
};

const readHeaderValue = (headers, name) => {
    if (!headers) return '';

    if (typeof headers.get === 'function') {
        return headers.get(name) || headers.get(name.toLowerCase()) || '';
    }

    const directValue = headers[name] || headers[name.toLowerCase()];
    if (Array.isArray(directValue)) {
        return directValue[0] || '';
    }

    return directValue || '';
};

const normalizeClientIdentifier = (value) => String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9:._@-]/g, '')
    .slice(0, 96);

const pruneRecentRequests = (now, cooldownMs) => {
    const ttl = Math.max(30000, cooldownMs * 4);
    for (const [clientId, lastSeenAt] of recentChatRequests.entries()) {
        if (now - lastSeenAt > ttl) {
            recentChatRequests.delete(clientId);
        }
    }
};

export const isChatEnabled = (value) => {
    if (value === undefined || value === null || value === '') return true;
    return !DISABLED_CHAT_VALUES.has(String(value).trim().toLowerCase());
};

export const getChatGatewayConfig = (env = {}) => ({
    enabled: isChatEnabled(env.CHAT_ENABLED),
    cooldownMs: toPositiveInteger(env.CHAT_GATEWAY_COOLDOWN_MS, DEFAULT_CHAT_GATEWAY_COOLDOWN_MS),
});

export const getChatClientIdentifier = ({ body = {}, headers } = {}) => {
    const forwardedFor = readHeaderValue(headers, 'x-forwarded-for');
    const forwardedIp = typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : '';

    const candidates = [
        body?.userId,
        body?.anonymousId,
        readHeaderValue(headers, 'x-user-id'),
        readHeaderValue(headers, 'x-anonymous-id'),
        readHeaderValue(headers, 'cf-connecting-ip'),
        readHeaderValue(headers, 'x-nf-client-connection-ip'),
        forwardedIp,
    ];

    for (const candidate of candidates) {
        const normalized = normalizeClientIdentifier(candidate);
        if (normalized) {
            return normalized;
        }
    }

    return 'anonymous';
};

export const enforceChatGatewayAccess = ({ env = {}, body = {}, headers, now = Date.now() } = {}) => {
    const config = getChatGatewayConfig(env);
    const clientId = getChatClientIdentifier({ body, headers });
    if (!config.enabled) {
        return {
            ok: false,
            clientId,
            statusCode: 503,
            body: {
                error: '今はノアと話せないわ。少し時間を置いてから試しなさい。',
                code: 'chat_disabled',
            },
        };
    }

    pruneRecentRequests(now, config.cooldownMs);

    const hasRecentRequest = recentChatRequests.has(clientId);
    const lastSeenAt = hasRecentRequest ? recentChatRequests.get(clientId) : 0;
    const retryAfterMs = hasRecentRequest
        ? Math.max(0, lastSeenAt + config.cooldownMs - now)
        : 0;

    if (retryAfterMs > 0) {
        return {
            ok: false,
            clientId,
            statusCode: 429,
            body: {
                error: `少し間を空けて話しかけなさい。あと${Math.ceil(retryAfterMs / 1000)}秒くらい待てば大丈夫よ。`,
                code: 'chat_cooldown',
                retryAfterMs,
            },
        };
    }

    recentChatRequests.set(clientId, now);

    return {
        ok: true,
        clientId,
        cooldownMs: config.cooldownMs,
    };
};

export const __resetChatGatewayForTests = () => {
    recentChatRequests.clear();
};
