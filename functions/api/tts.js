import {
    createElevenLabsSpeechResponse,
    createTtsHealthResponse,
    createTtsOptionsResponse,
} from '../_shared/ttsService.js';

export const onRequest = async (context) => {
    if (context.request.method === 'OPTIONS') {
        return createTtsOptionsResponse();
    }

    if (context.request.method === 'GET') {
        return createTtsHealthResponse(context.env);
    }

    if (context.request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    const body = await context.request.json().catch(() => null);
    if (!body) {
        return new Response(JSON.stringify({ error: 'Request body must be valid JSON' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    return createElevenLabsSpeechResponse({
        env: context.env,
        body,
    });
};
