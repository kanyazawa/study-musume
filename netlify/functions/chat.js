import { createNoaChatResponse } from '../../functions/_shared/chatService.js';
import { enforceChatGatewayAccess } from '../../functions/_shared/chatGateway.js';
import { logChatEvent } from '../../functions/_shared/chatLogging.js';

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
};

const toJson = (statusCode, body) => ({
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
});
const runtimeEnv = globalThis.process?.env || {};

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return toJson(405, { error: 'Method not allowed' });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return toJson(400, { error: 'Request body must be valid JSON' });
    }

    const gatewayAccess = enforceChatGatewayAccess({
        env: runtimeEnv,
        body,
        headers: event.headers,
    });
    if (!gatewayAccess.ok) {
        logChatEvent({
            transport: 'netlify-function',
            clientId: gatewayAccess.clientId,
            body,
            result: gatewayAccess,
            stage: 'gateway',
        });
        return toJson(gatewayAccess.statusCode, gatewayAccess.body);
    }

    try {
        const result = await createNoaChatResponse({
            geminiApiKey: runtimeEnv.GEMINI_API_KEY,
            geminiModel: runtimeEnv.GEMINI_CHAT_MODEL || undefined,
            openAiApiKey: runtimeEnv.OPENAI_API_KEY,
            openAiModel: runtimeEnv.OPENAI_CHAT_MODEL || undefined,
            body,
        });

        logChatEvent({
            transport: 'netlify-function',
            clientId: gatewayAccess.clientId,
            body,
            result,
        });

        return toJson(result.statusCode, result.body);
    } catch (error) {
        logChatEvent({
            transport: 'netlify-function',
            clientId: gatewayAccess.clientId,
            body,
            error,
            stage: 'exception',
        });
        return toJson(502, {
            error: '今はうまく返事できないみたい。少し時間を置いて試して。',
            code: 'chat_upstream_error',
        });
    }
}
