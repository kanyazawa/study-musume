import { createNoaChatResponse } from '../functions/_shared/chatService.js';
import { enforceChatGatewayAccess } from '../functions/_shared/chatGateway.js';
import { logChatEvent } from '../functions/_shared/chatLogging.js';
import { createWritingEvaluationResponse } from '../functions/_shared/writingService.js';
import {
    createSpeechResponse,
    createTtsHealthResponse,
    createTtsOptionsResponse,
} from '../functions/_shared/ttsService.js';

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
};

const buildJsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
});

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/api/chat') {
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    status: 204,
                    headers: {
                        ...JSON_HEADERS,
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                });
            }

            if (request.method !== 'POST') {
                return buildJsonResponse({ error: 'Method not allowed' }, 405);
            }

            const body = await request.json().catch(() => null);
            if (!body) {
                return buildJsonResponse({ error: 'Request body must be valid JSON' }, 400);
            }

            const gatewayAccess = enforceChatGatewayAccess({
                env,
                body,
                headers: request.headers,
            });
            if (!gatewayAccess.ok) {
                logChatEvent({
                    transport: 'worker',
                    clientId: gatewayAccess.clientId,
                    body,
                    result: gatewayAccess,
                    stage: 'gateway',
                });
                return buildJsonResponse(gatewayAccess.body, gatewayAccess.statusCode);
            }

            try {
                const result = await createNoaChatResponse({
                    geminiApiKey: env.GEMINI_API_KEY,
                    geminiModel: env.GEMINI_CHAT_MODEL || undefined,
                    openAiApiKey: env.OPENAI_API_KEY,
                    openAiModel: env.OPENAI_CHAT_MODEL || undefined,
                    body,
                });

                logChatEvent({
                    transport: 'worker',
                    clientId: gatewayAccess.clientId,
                    body,
                    result,
                });

                return buildJsonResponse(result.body, result.statusCode);
            } catch (error) {
                logChatEvent({
                    transport: 'worker',
                    clientId: gatewayAccess.clientId,
                    body,
                    error,
                    stage: 'exception',
                });
                return buildJsonResponse({ error: '今はノアがうまく返事できないわ。少し時間を置いて試しなさい。', code: 'chat_upstream_error' }, 502);
            }
        }

        if (url.pathname === '/api/writing') {
            if (request.method === 'OPTIONS') {
                return new Response(null, {
                    status: 204,
                    headers: {
                        ...JSON_HEADERS,
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                });
            }

            if (request.method !== 'POST') {
                return buildJsonResponse({ error: 'Method not allowed' }, 405);
            }

            const body = await request.json().catch(() => null);
            if (!body) {
                return buildJsonResponse({ error: 'Request body must be valid JSON' }, 400);
            }

            const result = await createWritingEvaluationResponse({
                geminiApiKey: env.GEMINI_API_KEY,
                geminiModel: env.GEMINI_WRITING_MODEL || env.GEMINI_CHAT_MODEL || undefined,
                openAiApiKey: env.OPENAI_API_KEY,
                openAiModel: env.OPENAI_WRITING_MODEL || env.OPENAI_CHAT_MODEL || undefined,
                body,
            });

            return buildJsonResponse(result.body, result.statusCode);
        }

        if (url.pathname === '/api/tts') {
            if (request.method === 'OPTIONS') {
                return createTtsOptionsResponse();
            }

            if (request.method === 'GET') {
                return createTtsHealthResponse(env);
            }

            if (request.method !== 'POST') {
                return buildJsonResponse({ error: 'Method not allowed' }, 405);
            }

            const body = await request.json().catch(() => null);
            if (!body) {
                return buildJsonResponse({ error: 'Request body must be valid JSON' }, 400);
            }

            return createSpeechResponse({
                env,
                body,
            });
        }

        return env.ASSETS.fetch(request);
    },
};
