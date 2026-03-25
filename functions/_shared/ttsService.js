const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
};

const AUDIO_HEADERS = {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
};

export const DEEPGRAM_TTS_DEFAULT_MODEL = 'aura-2-thalia-en';

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
});

const readErrorMessage = async (response) => {
    try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await response.json();
            return data?.err_msg || data?.error || data?.message || `Deepgram TTS request failed: ${response.status}`;
        }

        const text = await response.text();
        return text || `Deepgram TTS request failed: ${response.status}`;
    } catch {
        return `Deepgram TTS request failed: ${response.status}`;
    }
};

export const getDeepgramTtsRuntimeConfig = (env = {}) => {
    const apiKey = env.DEEPGRAM_API_KEY || '';
    const defaultModelId = env.DEEPGRAM_TTS_MODEL || DEEPGRAM_TTS_DEFAULT_MODEL;

    return {
        hasApiKey: Boolean(apiKey),
        configured: Boolean(apiKey),
        defaultModelId,
    };
};

export const createTtsHealthResponse = (env = {}) => {
    const config = getDeepgramTtsRuntimeConfig(env);
    return jsonResponse({
        ok: config.configured,
        provider: 'deepgram',
        hasApiKey: config.hasApiKey,
        defaultModelId: config.defaultModelId,
    });
};

export const createTtsOptionsResponse = () => new Response(null, {
    status: 204,
    headers: {
        ...JSON_HEADERS,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    },
});

export const createDeepgramSpeechResponse = async ({ env = {}, body, fetchImpl = fetch }) => {
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
        return jsonResponse({ error: 'Text is required' }, 400);
    }

    const apiKey = env.DEEPGRAM_API_KEY || '';
    if (!apiKey) {
        return jsonResponse({ error: 'DEEPGRAM_API_KEY is not set on the server' }, 500);
    }

    const model = typeof body?.model === 'string' && body.model.trim()
        ? body.model.trim()
        : (env.DEEPGRAM_TTS_MODEL || DEEPGRAM_TTS_DEFAULT_MODEL);

    const upstreamResponse = await fetchImpl(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}`, {
        method: 'POST',
        headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text,
        }),
    }).catch(() => null);

    if (!upstreamResponse) {
        return jsonResponse({ error: 'Deepgram TTS request failed before receiving a response' }, 502);
    }

    if (!upstreamResponse.ok) {
        const message = await readErrorMessage(upstreamResponse);
        return jsonResponse({ error: message }, upstreamResponse.status);
    }

    const audioBuffer = await upstreamResponse.arrayBuffer();
    return new Response(audioBuffer, {
        status: 200,
        headers: {
            ...AUDIO_HEADERS,
            'Content-Type': upstreamResponse.headers.get('content-type') || 'audio/mpeg',
        },
    });
};
