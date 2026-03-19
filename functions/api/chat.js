import { createNoaChatResponse } from '../_shared/chatService.js';

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

    const result = await createNoaChatResponse({
        apiKey: context.env.OPENAI_API_KEY,
        model: context.env.OPENAI_CHAT_MODEL || undefined,
        body,
    });

    return new Response(JSON.stringify(result.body), {
        status: result.statusCode,
        headers: JSON_HEADERS,
    });
};
