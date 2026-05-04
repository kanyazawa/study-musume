const getUsageSummary = (usage) => {
    if (!usage || typeof usage !== 'object') return null;

    const promptTokens = Number(
        usage.promptTokenCount
        ?? usage.input_tokens
        ?? usage.inputTokens
        ?? usage.prompt_tokens
    );
    const completionTokens = Number(
        usage.candidatesTokenCount
        ?? usage.output_tokens
        ?? usage.outputTokens
        ?? usage.completion_tokens
    );
    const totalTokens = Number(
        usage.totalTokenCount
        ?? usage.total_tokens
        ?? usage.totalTokens
    );

    const summary = {};
    if (Number.isFinite(promptTokens)) summary.promptTokens = promptTokens;
    if (Number.isFinite(completionTokens)) summary.completionTokens = completionTokens;
    if (Number.isFinite(totalTokens)) summary.totalTokens = totalTokens;

    return Object.keys(summary).length > 0 ? summary : null;
};

const getMessageLength = (body = {}) => String(body?.message || '').trim().length;

const getRecentMessageCount = (body = {}) => Array.isArray(body?.recentMessages)
    ? body.recentMessages.length
    : 0;

const getClientHint = (clientId) => {
    const normalized = String(clientId || '').trim();
    if (!normalized) return 'anonymous';
    return normalized.length <= 8 ? normalized : normalized.slice(-8);
};

export const buildChatLogEntry = ({
    transport = 'unknown',
    clientId = '',
    body = {},
    result = null,
    error = null,
    stage = 'response',
} = {}) => ({
    timestamp: new Date().toISOString(),
    route: 'chat',
    transport,
    stage,
    clientIdHint: getClientHint(clientId),
    inputLength: getMessageLength(body),
    recentMessageCount: getRecentMessageCount(body),
    blocked: result?.body?.blocked === true,
    safetyCategory: result?.body?.safetyCategory || null,
    provider: result?.body?.provider || null,
    model: result?.body?.model || null,
    usage: getUsageSummary(result?.body?.usage),
    error: error ? String(error.message || error) : (result?.body?.error || null),
    code: result?.body?.code || null,
    statusCode: result?.statusCode || null,
});

export const logChatEvent = (payload, logger = console) => {
    const entry = buildChatLogEntry(payload);
    const serialized = JSON.stringify(entry);

    if (entry.error) {
        logger.error('[NoaChat]', serialized);
        return entry;
    }

    if (entry.blocked || entry.code) {
        logger.warn('[NoaChat]', serialized);
        return entry;
    }

    logger.info('[NoaChat]', serialized);
    return entry;
};
