const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
};

const AUDIO_HEADERS = {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
};

export const DEEPGRAM_TTS_DEFAULT_MODEL = 'aura-2-uzume-ja';
export const AIVIS_CLOUD_TTS_DEFAULT_FORMAT = 'mp3';
export const AIVIS_CLOUD_TTS_ENDPOINT = 'https://api.aivis-project.com/v1/tts/synthesize';

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
});

const readErrorMessage = async (response, fallbackLabel = 'TTS request') => {
    try {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await response.json();
            return data?.detail || data?.err_msg || data?.error || data?.message || `${fallbackLabel} failed: ${response.status}`;
        }

        const text = await response.text();
        return text || `${fallbackLabel} failed: ${response.status}`;
    } catch {
        return `${fallbackLabel} failed: ${response.status}`;
    }
};

export const getTtsRuntimeConfig = (env = {}) => {
    const aivisApiKey = env.AIVIS_CLOUD_API_KEY || '';
    const aivisModelUuid = env.AIVIS_CLOUD_MODEL_UUID || '';
    const aivisStyleId = env.AIVIS_CLOUD_STYLE_ID || '';
    const deepgramApiKey = env.DEEPGRAM_API_KEY || '';
    const deepgramModelId = env.DEEPGRAM_TTS_MODEL || DEEPGRAM_TTS_DEFAULT_MODEL;
    const hasAivisConfig = Boolean(aivisApiKey && aivisModelUuid);

    return {
        provider: hasAivisConfig ? 'aivis_cloud' : 'deepgram',
        hasApiKey: Boolean(aivisApiKey || deepgramApiKey),
        configured: hasAivisConfig || Boolean(deepgramApiKey),
        hasAivisApiKey: Boolean(aivisApiKey),
        hasAivisModelUuid: Boolean(aivisModelUuid),
        defaultModelId: hasAivisConfig ? aivisModelUuid : deepgramModelId,
        defaultStyleId: hasAivisConfig ? aivisStyleId : '',
    };
};

export const createTtsHealthResponse = (env = {}) => {
    const config = getTtsRuntimeConfig(env);
    return jsonResponse({
        ok: config.configured,
        provider: config.provider,
        hasApiKey: config.hasApiKey,
        defaultModelId: config.defaultModelId,
        hasAivisModelUuid: config.hasAivisModelUuid,
        defaultStyleId: config.defaultStyleId,
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

const createAivisCloudSpeechResponse = async ({ env = {}, body, fetchImpl = fetch }) => {
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!text) {
        return jsonResponse({ error: 'Text is required' }, 400);
    }

    const apiKey = env.AIVIS_CLOUD_API_KEY || '';
    if (!apiKey) {
        return jsonResponse({ error: 'AIVIS_CLOUD_API_KEY is not set on the server' }, 500);
    }

    const modelUuid = typeof body?.modelUuid === 'string' && body.modelUuid.trim()
        ? body.modelUuid.trim()
        : (env.AIVIS_CLOUD_MODEL_UUID || '');
    if (!modelUuid) {
        return jsonResponse({ error: 'AIVIS_CLOUD_MODEL_UUID is not set on the server' }, 500);
    }

    const payload = {
        model_uuid: modelUuid,
        text,
        use_ssml: body?.useSsml !== false,
        use_volume_normalizer: body?.useVolumeNormalizer !== false,
        output_format: AIVIS_CLOUD_TTS_DEFAULT_FORMAT,
        leading_silence_seconds: 0.0,
        trailing_silence_seconds: 0.1,
    };

    const styleIdValue = body?.styleId ?? env.AIVIS_CLOUD_STYLE_ID;
    if (styleIdValue !== undefined && styleIdValue !== null && styleIdValue !== '') {
        const numericStyleId = Number(styleIdValue);
        if (Number.isInteger(numericStyleId)) {
            payload.style_id = numericStyleId;
        }
    }

    const styleName = typeof body?.styleName === 'string' && body.styleName.trim()
        ? body.styleName.trim()
        : (env.AIVIS_CLOUD_STYLE_NAME || '');
    if (styleName && payload.style_id === undefined) {
        payload.style_name = styleName;
    }

    const speakerUuid = typeof body?.speakerUuid === 'string' && body.speakerUuid.trim()
        ? body.speakerUuid.trim()
        : (env.AIVIS_CLOUD_SPEAKER_UUID || '');
    if (speakerUuid) {
        payload.speaker_uuid = speakerUuid;
    }

    const upstreamResponse = await fetchImpl(AIVIS_CLOUD_TTS_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    }).catch(() => null);

    if (!upstreamResponse) {
        return jsonResponse({ error: 'Aivis Cloud TTS request failed before receiving a response' }, 502);
    }

    if (!upstreamResponse.ok) {
        const message = await readErrorMessage(upstreamResponse, 'Aivis Cloud TTS request');
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
        const message = await readErrorMessage(upstreamResponse, 'Deepgram TTS request');
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

export const createSpeechResponse = async ({ env = {}, body, fetchImpl = fetch }) => {
    const config = getTtsRuntimeConfig(env);
    if (config.provider === 'aivis_cloud') {
        return createAivisCloudSpeechResponse({ env, body, fetchImpl });
    }

    return createDeepgramSpeechResponse({ env, body, fetchImpl });
};
