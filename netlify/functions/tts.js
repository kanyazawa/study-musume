import { createDeepgramSpeechResponse, getDeepgramTtsRuntimeConfig } from '../../functions/_shared/ttsService.js';

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
};

const toJson = (statusCode, body) => ({
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
});

const responseToNetlify = async (response) => {
    const headers = Object.fromEntries(response.headers.entries());
    const contentType = headers['content-type'] || '';

    if (contentType.includes('application/json')) {
        return {
            statusCode: response.status,
            headers,
            body: await response.text(),
        };
    }

    const bytes = await response.arrayBuffer();
    return {
        statusCode: response.status,
        headers,
        body: Buffer.from(bytes).toString('base64'),
        isBase64Encoded: true,
    };
};

export async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                ...JSON_HEADERS,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        };
    }

    if (event.httpMethod === 'GET') {
        const config = getDeepgramTtsRuntimeConfig(process.env);
        return toJson(200, {
            ok: config.configured,
            provider: 'deepgram',
            hasApiKey: config.hasApiKey,
            defaultModelId: config.defaultModelId,
        });
    }

    if (event.httpMethod !== 'POST') {
        return toJson(405, { error: 'Method not allowed' });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return toJson(400, { error: 'Request body must be valid JSON' });
    }

    const response = await createDeepgramSpeechResponse({
        env: process.env,
        body,
    });

    return responseToNetlify(response);
}
