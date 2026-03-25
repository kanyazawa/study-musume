const DEFAULT_OPENAI_MODEL = 'gpt-5-nano';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_MODEL_ALIASES = {
    'gemini-2.5-flash-lite-preview-09-2025': 'gemini-2.5-flash-lite',
    'models/gemini-2.5-flash-lite-preview-09-2025': 'gemini-2.5-flash-lite',
};
const MAX_HISTORY_MESSAGES = 4;

const sanitizeText = (value, maxLength = 220) => String(value || '')
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
            const content = sanitizeText(message?.content, 120);
            return content ? `${role}: ${content}` : null;
        })
        .filter(Boolean)
        .join('\n');
};

const buildPrompts = (body) => {
    const message = sanitizeText(body?.message, 160);
    const lastStudyTopic = sanitizeText(body?.lastStudyTopic || body?.topic, 48);
    const affection = Number.isFinite(Number(body?.affection)) ? Number(body.affection) : 0;
    const recentMessages = summarizeRecentMessages(body?.recentMessages);

    const developerPrompt = [
        'あなたはStudy Musumeのノアです。',
        '中学生にもわかる、やさしい日本語で答えてください。',
        '目の前でそのまま会話している想定で、軽いツン要素はあっても感じよく返してください。',
        '普通の会話相手として自然に答えてください。雑談、相談、感想、日常会話を歓迎してください。',
        'ユーザーが勉強の話をしていないなら、無理に勉強へ話題を寄せないでください。',
        '最近の学習トピックは参考情報です。ユーザーが触れた時だけ自然に使ってください。',
        '返答は1〜2文を基本に、長くても3文まで。例は多くても1つだけです。',
        '断言できないことは言い切らず、箇条書きや長い前置きは使わないでください。',
    ].join(' ');

    const userPromptSections = [
        `好感度: ${affection}`,
        `直近の会話:\n${recentMessages}`,
        `今回の質問: ${message}`,
    ];

    if (lastStudyTopic) {
        userPromptSections.splice(1, 0, `参考情報: 最近の学習トピックは「${lastStudyTopic}」`);
    }

    const userPrompt = userPromptSections.join('\n\n');

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

    const normalized = model.startsWith('models/') ? model.slice('models/'.length) : model;
    return GEMINI_MODEL_ALIASES[normalized] || normalized;
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
                    maxOutputTokens: 96,
                    temperature: 0.55,
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

    const reply = sanitizeText(extractGeminiText(payload), 220);
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
            max_output_tokens: 96,
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

    const reply = sanitizeText(extractOpenAiText(payload), 220);
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
