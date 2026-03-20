const DEFAULT_OPENAI_MODEL = 'gpt-5-nano';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite-preview-09-2025';
const MAX_HISTORY_MESSAGES = 6;

const sanitizeText = (value, maxLength = 320) => String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const summarizeRecentMessages = (messages) => {
    if (!Array.isArray(messages) || messages.length === 0) {
        return 'なし';
    }

    return messages
        .slice(-MAX_HISTORY_MESSAGES)
        .map((message) => {
            const role = message?.role === 'assistant' ? 'ノア' : 'ユーザー';
            const content = sanitizeText(message?.content, 180);
            return content ? `${role}: ${content}` : null;
        })
        .filter(Boolean)
        .join('\n');
};

const buildPrompts = (body) => {
    const message = sanitizeText(body?.message, 240);
    const topic = sanitizeText(body?.topic, 80) || '最近の勉強';
    const affection = Number.isFinite(Number(body?.affection)) ? Number(body.affection) : 0;
    const recentMessages = summarizeRecentMessages(body?.recentMessages);

    const developerPrompt = [
        'あなたはStudy Musumeのノアです。',
        '中学生にもわかる、やさしい日本語で答えてください。',
        '返答は2〜3文まで、短く具体的にしてください。',
        '勉強の質問を優先し、必要なら例は1つだけ出してください。',
        '断言できないことは推測で言い切らず、短く保留を伝えてください。',
        '箇条書きや長い前置きは使わないでください。',
    ].join(' ');

    const userPrompt = [
        `現在の学習トピック: ${topic}`,
        `好感度: ${affection}`,
        `直近の会話:\n${recentMessages}`,
        `今回の質問: ${message}`,
    ].join('\n\n');

    return {
        developerPrompt,
        userPrompt,
        message,
    };
};

const extractOpenAiText = (payload) => {
    if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
        return payload.output_text.trim();
    }

    if (!Array.isArray(payload?.output)) {
        return '';
    }

    return payload.output
        .filter((item) => item?.type === 'message')
        .flatMap((item) => Array.isArray(item.content) ? item.content : [])
        .filter((content) => content?.type === 'output_text' && typeof content.text === 'string')
        .map((content) => content.text)
        .join('\n')
        .trim();
};

const extractGeminiText = (payload) => {
    if (!Array.isArray(payload?.candidates)) {
        return '';
    }

    return payload.candidates
        .flatMap((candidate) => candidate?.content?.parts || [])
        .filter((part) => typeof part?.text === 'string')
        .map((part) => part.text)
        .join('\n')
        .trim();
};

const normalizeGeminiModel = (model) => {
    if (!model) return DEFAULT_GEMINI_MODEL;
    return model.startsWith('models/') ? model.slice('models/'.length) : model;
};

const callGeminiChat = async ({
    apiKey,
    model = DEFAULT_GEMINI_MODEL,
    developerPrompt,
    userPrompt,
    fetchImpl,
}) => {
    const response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${normalizeGeminiModel(model)}:generateContent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `${developerPrompt}\n\n${userPrompt}`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 180,
                    temperature: 0.7,
                },
            }),
        }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        return {
            statusCode: response.status,
            body: {
                error: payload?.error?.message || 'Gemini request failed',
            },
        };
    }

    const reply = sanitizeText(extractGeminiText(payload), 320);
    if (!reply) {
        return {
            statusCode: 502,
            body: { error: 'Gemini returned an empty reply' },
        };
    }

    return {
        statusCode: 200,
        body: {
            reply,
            model: normalizeGeminiModel(model),
            provider: 'gemini',
            usage: payload?.usageMetadata || null,
        },
    };
};

const callOpenAiChat = async ({
    apiKey,
    model = DEFAULT_OPENAI_MODEL,
    developerPrompt,
    userPrompt,
    fetchImpl,
}) => {
    const response = await fetchImpl('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            store: false,
            max_output_tokens: 180,
            text: {
                format: {
                    type: 'text',
                },
            },
            input: [
                {
                    role: 'developer',
                    content: [
                        {
                            type: 'input_text',
                            text: developerPrompt,
                        },
                    ],
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: userPrompt,
                        },
                    ],
                },
            ],
        }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        return {
            statusCode: response.status,
            body: {
                error: payload?.error?.message || 'OpenAI request failed',
            },
        };
    }

    const reply = sanitizeText(extractOpenAiText(payload), 320);
    if (!reply) {
        return {
            statusCode: 502,
            body: { error: 'Model returned an empty reply' },
        };
    }

    return {
        statusCode: 200,
        body: {
            reply,
            model,
            provider: 'openai',
            usage: payload?.usage || null,
        },
    };
};

export const createNoaChatResponse = async ({
    geminiApiKey,
    geminiModel = DEFAULT_GEMINI_MODEL,
    openAiApiKey,
    openAiModel = DEFAULT_OPENAI_MODEL,
    body,
    fetchImpl = fetch,
}) => {
    const { developerPrompt, userPrompt, message } = buildPrompts(body);

    if (!message) {
        return {
            statusCode: 400,
            body: { error: 'message is required' },
        };
    }

    if (geminiApiKey) {
        return callGeminiChat({
            apiKey: geminiApiKey,
            model: geminiModel,
            developerPrompt,
            userPrompt,
            fetchImpl,
        });
    }

    if (openAiApiKey) {
        return callOpenAiChat({
            apiKey: openAiApiKey,
            model: openAiModel,
            developerPrompt,
            userPrompt,
            fetchImpl,
        });
    }

    return {
        statusCode: 500,
        body: { error: 'GEMINI_API_KEY or OPENAI_API_KEY is not set on the server' },
    };
};
