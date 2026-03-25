const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
};

const AUDIO_HEADERS = {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
};

export const ELEVENLABS_DEFAULT_MODEL = 'eleven_flash_v2_5';
export const ELEVENLABS_DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128';

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
});

const readErrorMessage = async (response) => {
    try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await response.json();
            return data?.detail?.message || data?.message || data?.error || `ElevenLabs request failed: ${response.status}`;
        }

        const text = await response.text();
        return text || `ElevenLabs request failed: ${response.status}`;
    } catch {
        return `ElevenLabs request failed: ${response.status}`;
    }
};

export const getElevenLabsRuntimeConfig = (env = {}) => {
    const apiKey = env.ELEVENLABS_API_KEY || '';
    const defaultVoiceId = env.ELEVENLABS_VOICE_ID || '';
    const defaultModelId = env.ELEVENLABS_MODEL_ID || ELEVENLABS_DEFAULT_MODEL;

    return {
        hasApiKey: Boolean(apiKey),
        hasDefaultVoiceId: Boolean(defaultVoiceId),
        configured: Boolean(apiKey),
        defaultModelId,
    };
};

export const createTtsHealthResponse = (env = {}) => {
    const config = getElevenLabsRuntimeConfig(env);
    return jsonResponse({
        ok: config.configured,
        provider: 'elevenlabs',
        hasApiKey: config.hasApiKey,
        hasDefaultVoiceId: config.hasDefaultVoiceId,
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

export const createElevenLabsSpeechResponse = async ({ env = {}, body, fetchImpl = fetch }) => {
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
        return jsonResponse({ error: 'Text is required' }, 400);
    }

    const apiKey = env.ELEVENLABS_API_KEY || '';
    if (!apiKey) {
        return jsonResponse({ error: 'ELEVENLABS_API_KEY is not set on the server' }, 500);
    }

    const voiceId = typeof body?.voiceId === 'string' && body.voiceId.trim()
        ? body.voiceId.trim()
        : (env.ELEVENLABS_VOICE_ID || '').trim();
    if (!voiceId) {
        return jsonResponse({ error: 'ELEVENLABS_VOICE_ID is not set on the server' }, 500);
    }

    const modelId = typeof body?.modelId === 'string' && body.modelId.trim()
        ? body.modelId.trim()
        : (env.ELEVENLABS_MODEL_ID || ELEVENLABS_DEFAULT_MODEL);

    const upstreamResponse = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
            text,
            model_id: modelId,
            output_format: ELEVENLABS_DEFAULT_OUTPUT_FORMAT,
        }),
    }).catch(() => null);

    if (!upstreamResponse) {
        return jsonResponse({ error: 'ElevenLabs request failed before receiving a response' }, 502);
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
