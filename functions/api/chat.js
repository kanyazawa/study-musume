import { createNoaChatResponse } from '../_shared/chatService.js';
import { enforceChatGatewayAccess } from '../_shared/chatGateway.js';
import { logChatEvent } from '../_shared/chatLogging.js';

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
};

export const onRequestPost = async (context) => {
    const body = await context.request.json().catch(() => null);
    if (!body) {
        return new Response(JSON.stringify({ error: 'Request body must be valid JSON' }), {
            status: 400,
            headers: JSON_HEADERS,
        });
    }

    const gatewayAccess = enforceChatGatewayAccess({
        env: context.env,
        body,
        headers: context.request.headers,
    });
    if (!gatewayAccess.ok) {
        logChatEvent({
            transport: 'pages-function',
            clientId: gatewayAccess.clientId,
            body,
            result: gatewayAccess,
            stage: 'gateway',
        });
        return new Response(JSON.stringify(gatewayAccess.body), {
            status: gatewayAccess.statusCode,
            headers: JSON_HEADERS,
        });
    }

    try {
        const result = await createNoaChatResponse({
            geminiApiKey: context.env.GEMINI_API_KEY,
            geminiModel: context.env.GEMINI_CHAT_MODEL || undefined,
            openAiApiKey: context.env.OPENAI_API_KEY,
            openAiModel: context.env.OPENAI_CHAT_MODEL || undefined,
            body,
        });

        logChatEvent({
            transport: 'pages-function',
            clientId: gatewayAccess.clientId,
            body,
            result,
        });

        return new Response(JSON.stringify(result.body), {
            status: result.statusCode,
            headers: JSON_HEADERS,
        });
    } catch (error) {
        logChatEvent({
            transport: 'pages-function',
            clientId: gatewayAccess.clientId,
            body,
            error,
            stage: 'exception',
        });
        return new Response(JSON.stringify({
            error: '今はうまく返事できないみたい。少し時間を置いて試して。',
            code: 'chat_upstream_error',
        }), {
            status: 502,
            headers: JSON_HEADERS,
        });
    }
};
