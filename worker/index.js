import { createNoaChatResponse } from '../functions/_shared/chatService.js';

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
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

            const result = await createNoaChatResponse({
                apiKey: env.OPENAI_API_KEY,
                model: env.OPENAI_CHAT_MODEL || undefined,
                body,
            });

            return buildJsonResponse(result.body, result.statusCode);
        }

        return env.ASSETS.fetch(request);
    },
};
