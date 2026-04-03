const DEFAULT_OPENAI_MODEL = 'gpt-5-nano';
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_MODEL_ALIASES = {
    'gemini-2.5-flash-lite-preview-09-2025': 'gemini-2.5-flash-lite',
    'models/gemini-2.5-flash-lite-preview-09-2025': 'gemini-2.5-flash-lite',
};
const MAX_SCORE = 16;
const CATEGORY_MAX_SCORE = 4;

const clamp = (value, min, max) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return min;
    }

    return Math.min(Math.max(Math.round(numeric), min), max);
};

const sanitizeInlineText = (value, maxLength = 220) => String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const sanitizeParagraph = (value, maxLength = 500) => String(value || '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);

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

const sanitizeList = (value, fallback) => {
    if (!Array.isArray(value)) {
        return fallback;
    }

    const items = value
        .map((item) => sanitizeInlineText(item, 140))
        .filter(Boolean)
        .slice(0, 3);

    return items.length > 0 ? items : fallback;
};

export const extractStructuredWritingEvaluation = (rawText) => {
    const parsed = tryParseJsonObject(rawText) || {};
    const breakdown = {
        content: clamp(parsed?.breakdown?.content, 0, CATEGORY_MAX_SCORE),
        organization: clamp(parsed?.breakdown?.organization, 0, CATEGORY_MAX_SCORE),
        vocabulary: clamp(parsed?.breakdown?.vocabulary, 0, CATEGORY_MAX_SCORE),
        grammar: clamp(parsed?.breakdown?.grammar, 0, CATEGORY_MAX_SCORE),
    };
    const computedOverall = breakdown.content + breakdown.organization + breakdown.vocabulary + breakdown.grammar;
    const overallScore = clamp(parsed?.overallScore, 0, MAX_SCORE) || computedOverall;

    return {
        overallScore: overallScore || computedOverall,
        maxScore: MAX_SCORE,
        breakdown,
        summary: sanitizeInlineText(
            parsed?.summaryJa || parsed?.summary || '論点は伝わっています。次は文のつながりと語彙の幅を少しずつ伸ばしていきましょう。',
            220
        ),
        strengths: sanitizeList(parsed?.strengthsJa || parsed?.strengths, [
            '自分の立場をはっきり示せています。',
            '伝えたい内容が読み取りやすいです。',
        ]),
        improvements: sanitizeList(parsed?.improvementsJa || parsed?.improvementPoints || parsed?.improvements, [
            '理由どうしのつながりをもう少し明確にしましょう。',
            '文法ミスを1つずつ減らすと点が伸びやすいです。',
        ]),
        revisedAnswer: sanitizeParagraph(parsed?.revisedAnswer, 700),
        modelAnswer: sanitizeParagraph(parsed?.modelAnswer, 700),
        encouragement: sanitizeInlineText(
            parsed?.encouragementJa || parsed?.encouragement || 'いい下書きです。1本ずつ直していけば、ちゃんと伸びます。',
            160
        ),
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

const buildPrompts = (body) => {
    const answer = String(body?.answer || '').trim().slice(0, 4000);
    const levelLabel = sanitizeInlineText(body?.levelLabel, 24);
    const title = sanitizeInlineText(body?.title, 64);
    const instruction = sanitizeInlineText(body?.instruction, 320);
    const points = Array.isArray(body?.points)
        ? body.points.map((point) => sanitizeInlineText(point, 32)).filter(Boolean).slice(0, 4)
        : [];
    const wordCount = clamp(body?.wordCount, 0, 1000);
    const minWords = clamp(body?.minWords, 0, 1000);
    const maxWords = clamp(body?.maxWords, 0, 1000);

    const developerPrompt = [
        'You are an English writing coach for Japanese learners.',
        'Evaluate one student answer for an Eiken-style writing practice task.',
        'This is a practice rubric, not official Eiken scoring.',
        'Score these four categories from 0 to 4: content, organization, vocabulary, grammar.',
        'Be accurate, concise, and encouraging.',
        'Return JSON only.',
        'Required JSON shape:',
        '{"overallScore":0,"maxScore":16,"breakdown":{"content":0,"organization":0,"vocabulary":0,"grammar":0},"summaryJa":"","strengthsJa":["",""],"improvementsJa":["",""],"revisedAnswer":"","modelAnswer":"","encouragementJa":""}',
        'summaryJa, strengthsJa, improvementsJa, encouragementJa must be natural Japanese.',
        'revisedAnswer and modelAnswer must be English only.',
        'Keep revisedAnswer and modelAnswer close to the requested word range.',
        'Do not use markdown.',
    ].join(' ');

    const userPrompt = [
        `Level: ${levelLabel || '英作文'}`,
        `Title: ${title || 'Writing Task'}`,
        `Instruction: ${instruction}`,
        `Suggested points: ${points.length > 0 ? points.join(', ') : 'none'}`,
        `Target word range: ${minWords}-${maxWords}`,
        `Student word count: ${wordCount}`,
        'Student answer:',
        answer,
    ].join('\n');

    return {
        developerPrompt,
        userPrompt,
        answer,
    };
};

const callGeminiWriting = async ({
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
                    maxOutputTokens: 700,
                    temperature: 0.35,
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

    const evaluation = extractStructuredWritingEvaluation(extractGeminiText(payload));
    return {
        statusCode: 200,
        body: {
            evaluation,
            model: normalizeGeminiModel(model),
            provider: 'gemini',
            usage: payload?.usageMetadata || null,
        },
    };
};

const callOpenAiWriting = async ({
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
            max_output_tokens: 700,
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

    const evaluation = extractStructuredWritingEvaluation(extractOpenAiText(payload));
    return {
        statusCode: 200,
        body: {
            evaluation,
            model,
            provider: 'openai',
            usage: payload?.usage || null,
        },
    };
};

export const createWritingEvaluationResponse = async ({
    geminiApiKey,
    geminiModel = DEFAULT_GEMINI_MODEL,
    openAiApiKey,
    openAiModel = DEFAULT_OPENAI_MODEL,
    body,
    fetchImpl = fetch,
}) => {
    const { developerPrompt, userPrompt, answer } = buildPrompts(body);

    if (!answer) {
        return {
            statusCode: 400,
            body: { error: 'answer is required' },
        };
    }

    if (geminiApiKey) {
        return callGeminiWriting({
            apiKey: geminiApiKey,
            model: geminiModel,
            developerPrompt,
            userPrompt,
            fetchImpl,
        });
    }

    if (openAiApiKey) {
        return callOpenAiWriting({
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
