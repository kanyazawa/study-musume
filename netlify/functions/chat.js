import { createNoaChatResponse } from '../../functions/_shared/chatService.js';

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
};

const toJson = (statusCode, body) => ({
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
});

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

    const result = await createNoaChatResponse({
        geminiApiKey: process.env.GEMINI_API_KEY,
        geminiModel: process.env.GEMINI_CHAT_MODEL || undefined,
        openAiApiKey: process.env.OPENAI_API_KEY,
        openAiModel: process.env.OPENAI_CHAT_MODEL || undefined,
        body,
    });

    return toJson(result.statusCode, result.body);
}
