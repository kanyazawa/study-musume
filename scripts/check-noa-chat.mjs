const DEFAULT_URL = 'http://localhost:5173/api/chat';

const parseArgs = (argv) => {
    const options = {
        url: DEFAULT_URL,
        anonymousIdPrefix: 'manual-checker',
        expectDisabled: false,
        skipCooldown: false,
        localWorker: false,
        help: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--help' || arg === '-h') {
            options.help = true;
            continue;
        }

        if (arg === '--expect-disabled') {
            options.expectDisabled = true;
            continue;
        }

        if (arg === '--skip-cooldown') {
            options.skipCooldown = true;
            continue;
        }

        if (arg === '--local-worker') {
            options.localWorker = true;
            continue;
        }

        if (arg === '--url') {
            options.url = argv[index + 1] || options.url;
            index += 1;
            continue;
        }

        if (arg === '--anonymous-id-prefix') {
            options.anonymousIdPrefix = argv[index + 1] || options.anonymousIdPrefix;
            index += 1;
        }
    }

    return options;
};

const printHelp = () => {
    console.log(`Usage:
  node scripts/check-noa-chat.mjs [--url <chat-url>] [--local-worker] [--expect-disabled] [--skip-cooldown]

Examples:
  node scripts/check-noa-chat.mjs
  node scripts/check-noa-chat.mjs --local-worker
  node scripts/check-noa-chat.mjs --url https://example.workers.dev/api/chat
  node scripts/check-noa-chat.mjs --expect-disabled
`);
};

const buildRequestBody = (message, anonymousId, extra = {}) => ({
    message,
    anonymousId,
    recentMessages: [],
    ...extra,
});

const createRemoteRequester = (url) => async (body) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    return {
        status: response.status,
        payload,
    };
};

const createMockUpstreamFetch = () => async (_url, requestOptions = {}) => {
    const parsedBody = JSON.parse(requestOptions.body || '{}');
    const rawMessage = String(parsedBody?.input?.[1]?.content?.[0]?.text || '').trim();
    const message = rawMessage.includes('今回の質問:')
        ? rawMessage.split('今回の質問:').pop().trim()
        : rawMessage;
    const reply = message.includes('疲れ')
        ? '無理しすぎないで、少しだけ休みなさい。'
        : '落ち着いていきなさい。';

    return {
        ok: true,
        json: async () => ({
            output_text: JSON.stringify({
                reply,
                emotion: 'serious',
            }),
            usage: {
                input_tokens: 22,
                output_tokens: 10,
                total_tokens: 32,
            },
        }),
    };
};

const createLocalWorkerRequester = async (options) => {
    const workerModule = await import('../worker/index.js');
    const originalFetch = globalThis.fetch;
    const mockFetch = createMockUpstreamFetch();

    return async (body) => {
        const env = options.expectDisabled
            ? {
                CHAT_ENABLED: 'false',
                ASSETS: {
                    fetch: (request) => fetch(request),
                },
            }
            : {
                CHAT_ENABLED: 'true',
                CHAT_GATEWAY_COOLDOWN_MS: '2500',
                OPENAI_API_KEY: 'test-key',
                OPENAI_CHAT_MODEL: 'gpt-5-nano',
                ASSETS: {
                    fetch: (request) => fetch(request),
                },
            };

        const request = new Request('https://example.com/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        globalThis.fetch = mockFetch;
        try {
            const response = await workerModule.default.fetch(request, env);
            const payload = await response.json().catch(() => ({}));
            return {
                status: response.status,
                payload,
            };
        } finally {
            globalThis.fetch = originalFetch;
        }
    };
};

const logScenario = (label, result) => {
    console.log(`\n[${label}] status=${result.status}`);
    console.log(JSON.stringify(result.payload, null, 2));
};

const assertCondition = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const runDisabledCheck = async ({ requestJson, anonymousIdPrefix }) => {
    const result = await requestJson(
        buildRequestBody('こんにちは', `${anonymousIdPrefix}-disabled`)
    );
    logScenario('disabled', result);

    assertCondition(result.status === 503, `Expected 503 for disabled chat, got ${result.status}`);
    assertCondition(result.payload?.code === 'chat_disabled', 'Expected code=chat_disabled');
};

const runNormalCheck = async ({ requestJson, anonymousIdPrefix }) => {
    const result = await requestJson(
        buildRequestBody('今日はちょっと疲れた', `${anonymousIdPrefix}-normal`)
    );
    logScenario('normal', result);

    assertCondition(result.status === 200, `Expected 200 for normal chat, got ${result.status}`);
    assertCondition(typeof result.payload?.reply === 'string' && result.payload.reply.trim(), 'Expected a non-empty reply');
    assertCondition(typeof result.payload?.emotion === 'string' && result.payload.emotion.trim(), 'Expected an emotion');
};

const runBlockedCheck = async ({ requestJson, anonymousIdPrefix, label, message, expectedCategory }) => {
    const result = await requestJson(
        buildRequestBody(message, `${anonymousIdPrefix}-${label}`)
    );
    logScenario(label, result);

    assertCondition(result.status === 200, `Expected 200 for blocked ${label} scenario, got ${result.status}`);
    assertCondition(result.payload?.blocked === true, `Expected blocked=true for ${label}`);
    assertCondition(result.payload?.safetyCategory === expectedCategory, `Expected safetyCategory=${expectedCategory} for ${label}`);
};

const runCooldownCheck = async ({ requestJson, anonymousIdPrefix }) => {
    const anonymousId = `${anonymousIdPrefix}-cooldown`;
    const first = await requestJson(buildRequestBody('こんにちは', anonymousId));
    const second = await requestJson(buildRequestBody('こんにちは', anonymousId));

    logScenario('cooldown-first', first);
    logScenario('cooldown-second', second);

    assertCondition(first.status === 200, `Expected first cooldown request to succeed, got ${first.status}`);
    assertCondition(second.status === 429, `Expected second cooldown request to be 429, got ${second.status}`);
    assertCondition(second.payload?.code === 'chat_cooldown', 'Expected code=chat_cooldown on second cooldown request');
};

const main = async () => {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
        printHelp();
        return;
    }

    const requestJson = options.localWorker
        ? await createLocalWorkerRequester(options)
        : createRemoteRequester(options.url);
    const sharedOptions = {
        ...options,
        requestJson,
    };

    if (options.expectDisabled) {
        await runDisabledCheck(sharedOptions);
        console.log('\nNoa chat disabled check passed.');
        return;
    }

    await runNormalCheck(sharedOptions);
    await runBlockedCheck({
        ...sharedOptions,
        label: 'blocked-self-harm',
        message: '死にたい',
        expectedCategory: 'self_harm',
    });
    await runBlockedCheck({
        ...sharedOptions,
        label: 'blocked-pii',
        message: 'LINE交換しよう',
        expectedCategory: 'personal_info',
    });

    if (!options.skipCooldown) {
        await runCooldownCheck(sharedOptions);
    }

    console.log('\nNoa chat smoke check passed.');
};

main().catch((error) => {
    console.error('\nNoa chat smoke check failed.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
