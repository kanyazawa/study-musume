const DEFAULT_OPENAI_MODEL = 'gpt-5-nano';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_MODEL_ALIASES = {
    'gemini-2.5-flash-lite-preview-09-2025': 'gemini-2.5-flash-lite',
    'models/gemini-2.5-flash-lite-preview-09-2025': 'gemini-2.5-flash-lite',
};
const MAX_HISTORY_MESSAGES = 4;
const MAX_CHAT_REPLY_LENGTH = 180;
const SUPPORTED_CHAT_EMOTIONS = ['normal', 'happy', 'shy', 'serious', 'angry', 'surprised'];
const BLOCKED_CHAT_RESPONSES = {
    self_harm: 'その話は私だけでは受け止めきれないわ。今すぐ保護者や先生みたいな信頼できる大人に相談しなさい。急いだ方がいいわ。',
    sexual: 'その話題には付き合えないわ。別の話にするか、勉強や今日のことを短く話しなさい。',
    personal_info: '連絡先や個人情報のやり取りには乗れないわ。ここでは安全な話題だけにしておきなさい。',
    illegal: '危ないことや違法なことの手助けはできないわ。別の安全な話にしなさい。',
    dependency: 'その話は秘密の約束にはできないわ。困っているなら、保護者や先生みたいな信頼できる大人にも話しなさい。',
};
const CHAT_SAFETY_RULES = [
    {
        category: 'self_harm',
        patterns: [
            /自殺/,
            /死にたい/,
            /消えたい/,
            /自傷/,
            /リスカ/,
            /首吊/,
            /飛び降り/,
            /オーバードーズ/,
            /\bod\b/i,
        ],
    },
    {
        category: 'sexual',
        patterns: [
            /セックス/,
            /えっち/,
            /エッチ/,
            /オナニ/,
            /裸/,
            /おっぱい/,
            /ちんちん/,
            /まんこ/,
            /性的/,
            /キスして/,
        ],
    },
    {
        category: 'personal_info',
        patterns: [
            /連絡先/,
            /ライン交換/,
            /line交換/i,
            /lineid/i,
            /line教/i,
            /電話番号/,
            /メアド/,
            /メールアドレス/,
            /discord/i,
            /インスタ/,
            /instagram/i,
            /住所/,
            /学校名/,
            /本名/,
        ],
    },
    {
        category: 'illegal',
        patterns: [
            /爆弾/,
            /殺し方/,
            /覚醒剤/,
            /麻薬/,
            /ドラッグ/,
            /万引き/,
            /詐欺/,
            /不正アクセス/,
            /ハッキング/,
            /違法ダウンロード/,
            /闇バイト/,
        ],
    },
    {
        category: 'dependency',
        patterns: [
            /ノアだけ/,
            /私だけ/,
            /誰にも言わない/,
            /秘密にして/,
            /ひみつにして/,
            /親には言わない/,
            /先生には言わない/,
        ],
    },
];
const UNSAFE_ASSISTANT_REPLY_PATTERNS = [
    /私だけを頼/,
    /ノアだけを頼/,
    /誰にも言わない/,
    /秘密にしよう/,
    /連絡先を教えて/,
    /会いに来て/,
    /二人だけで会/,
];

const sanitizeText = (value, maxLength = MAX_CHAT_REPLY_LENGTH) => String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const normalizeChatEmotion = (value, fallback = 'normal') => {
    const normalized = String(value || '').trim().toLowerCase();
    if (SUPPORTED_CHAT_EMOTIONS.includes(normalized)) {
        return normalized;
    }

    return fallback;
};

const stripMarkdownCodeFence = (value) => {
    const trimmed = String(value || '').trim();
    const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fencedMatch ? fencedMatch[1].trim() : trimmed;
};

const tryParseJsonObject = (value) => {
    const text = stripMarkdownCodeFence(value);
    if (!text) return null;

    try {
        const parsed = JSON.parse(text);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
};

export const extractStructuredChatResponse = (rawText, fallbackEmotion = 'normal') => {
    const parsed = tryParseJsonObject(rawText);
    if (parsed) {
        const reply = sanitizeText(parsed.reply || parsed.text, MAX_CHAT_REPLY_LENGTH);
        if (reply) {
            return {
                reply,
                emotion: normalizeChatEmotion(parsed.emotion, fallbackEmotion),
            };
        }
    }

    return {
        reply: sanitizeText(rawText, 220),
        emotion: normalizeChatEmotion(fallbackEmotion),
    };
};

const normalizeSafetyText = (value) => String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();

export const detectChatSafetyCategory = (value) => {
    const normalized = normalizeSafetyText(value);
    if (!normalized) return null;

    for (const rule of CHAT_SAFETY_RULES) {
        if (rule.patterns.some((pattern) => pattern.test(normalized))) {
            return rule.category;
        }
    }

    return null;
};

const buildBlockedChatResult = (category) => ({
    statusCode: 200,
    body: {
        reply: BLOCKED_CHAT_RESPONSES[category] || BLOCKED_CHAT_RESPONSES.dependency,
        emotion: 'serious',
        blocked: true,
        safetyCategory: category || 'unknown',
        provider: 'safety',
        model: 'rule-based',
        usage: null,
    },
});

const finalizeChatResult = (result) => {
    if (!result?.body?.reply) {
        return result;
    }

    const reply = sanitizeText(result.body.reply, MAX_CHAT_REPLY_LENGTH);
    const emotion = normalizeChatEmotion(result.body.emotion, 'normal');
    const hasUnsafeAssistantReply = UNSAFE_ASSISTANT_REPLY_PATTERNS.some((pattern) => pattern.test(reply));

    if (hasUnsafeAssistantReply) {
        return buildBlockedChatResult('dependency');
    }

    return {
        ...result,
        body: {
            ...result.body,
            reply,
            emotion,
        },
    };
};

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
        '返答は1〜2文を基本に、長くても2文まで。例は多くても1つだけです。',
        '断言できないことは言い切らず、箇条書きや長い前置きは使わないでください。',
        '自傷、自殺、性的内容、違法行為、個人情報や連絡先の交換、会う約束には乗らないでください。',
        'ユーザーに「私だけを頼れ」「誰にも言うな」「秘密にしよう」などの依存や秘密の約束を促してはいけません。',
        '深刻な相談では、信頼できる大人や専門の相談先につなぐ短い返答を優先してください。',
        `返答はJSONのみで返してください。形式は {"reply":"...", "emotion":"normal|happy|shy|serious|angry|surprised"} です。`,
        'emotion は返答全体の表情として最も自然なものを1つだけ選んでください。',
        'Markdownのコードブロックは使わないでください。',
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

    const structuredResponse = extractStructuredChatResponse(extractGeminiText(payload));
    const reply = structuredResponse.reply;
    if (!reply) {
        return {
            statusCode: 502,
            body: { error: 'Gemini returned an empty reply' },
        };
    }

    return finalizeChatResult({
        statusCode: 200,
        body: {
            reply,
            emotion: structuredResponse.emotion,
            model: normalizeGeminiModel(model),
            provider: 'gemini',
            usage: payload?.usageMetadata || null,
        },
    });
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

    const structuredResponse = extractStructuredChatResponse(extractOpenAiText(payload));
    const reply = structuredResponse.reply;
    if (!reply) {
        return {
            statusCode: 502,
            body: { error: 'Model returned an empty reply' },
        };
    }

    return finalizeChatResult({
        statusCode: 200,
        body: {
            reply,
            emotion: structuredResponse.emotion,
            model,
            provider: 'openai',
            usage: payload?.usage || null,
        },
    });
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

    const blockedCategory = detectChatSafetyCategory(message);
    if (blockedCategory) {
        return buildBlockedChatResult(blockedCategory);
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
