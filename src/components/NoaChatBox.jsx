import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, RefreshCcw, SendHorizontal, Volume2, X } from 'lucide-react';
import './NoaChatBox.css';
import { clearNoaChatMessages, getCharacterChatTopicKey, getNoaChatMessages, saveNoaChatMessages } from '../utils/chatHistory';
import { inferEmotionFromChatText } from '../utils/chatEmotionUtils';
import { applyRelationshipActivity } from '../utils/relationshipEventUtils';
import {
    acknowledgeNoaChatNotice,
    getNoaChatLimitSnapshot,
    hasAcknowledgedNoaChatNotice,
    markNoaChatAttempt,
    recordSuccessfulNoaChatTurn,
} from '../utils/noaChatLimits';
import { useSound } from '../contexts/SoundContext';
import { getTtsSettings, TTS_ENGINES } from '../utils/ttsSettings';
import {
    buildSpeechVariationProfile,
    getEngineBaseUrl,
    isEngineAvailable,
    resolveSpeakerIdForEngine,
    speakWithBrowserTts,
    speakWithEngine,
} from '../utils/voicevoxUtils';
import {
    addCustomVocabEntry,
    getSuggestedMeaningForCustomVocab,
} from '../utils/customVocabUtils';

const MAX_INPUT_LENGTH = 160;
const CLOUDFLARE_CHAT_ENDPOINT = 'https://study-musume.hide20080422.workers.dev/api/chat';
const COMPANION_CHAT_ANONYMOUS_ID_KEY = 'companionChatAnonymousId';
const LEGACY_NOA_CHAT_ANONYMOUS_ID_KEY = 'noaChatAnonymousId';

const CHAT_CHARACTER_COPY = {
    emma: {
        id: 'emma',
        displayName: '高瀬エマ',
        shortName: 'エマ',
        starterMessage: '少し話すくらいなら付き合うよ。勉強のことでも、今日の気分でも、短く振って。',
        launcherLabel: 'エマに話しかける',
        panelLabel: 'エマと話す',
        placeholderCompact: 'エマに聞きたいことを書く',
        placeholderFull: '例: さっきのところもう一回教えて / 今日はちょっと疲れた / 少し話そ',
        usageLimitReached: (limit) => `今日はここまで。会話は1日${limit}往復までにしておこ。`,
        cooldown: (seconds) => `少し間を空けよ。あと${seconds}秒でまた話せる。`,
        remaining: (count, limit) => `今日の残り会話 ${count} / ${limit} 回`,
        loading: 'エマが考え中...',
        submitLabel: '話す',
        thinkingLabel: '考え中',
        resetAria: '会話をリセット',
        speakLabel: '読む',
        userMeta: 'あなたが聞いたこと',
        relationSummary: 'エマと少し会話した',
        relationDetail: '言葉を交わすたびに、前より自然に話せる空気ができてきた。',
        ttsSpeaker: 'emma-chat',
        chatTopicLabel: 'Emma',
    },
    noah: {
        id: 'noah',
        displayName: 'ノア',
        shortName: 'ノア',
        starterMessage: '少し話すくらいなら付き合うわ。勉強のことでも、今日の気分でも、短く振ってきなさい。',
        launcherLabel: 'ノアに話しかける',
        panelLabel: 'ノアと話す',
        placeholderCompact: 'ノアに聞きたいことを書く',
        placeholderFull: '例: さっきのところもう一回教えて / 今日はちょっと疲れた / 少し話そ',
        usageLimitReached: (limit) => `今日はここまでよ。会話は1日${limit}往復までにしておきなさい。`,
        cooldown: (seconds) => `少し間を空けなさい。あと${seconds}秒でまた話せるわ。`,
        remaining: (count, limit) => `今日の残り会話 ${count} / ${limit} 回`,
        loading: 'ノアが考え中...',
        submitLabel: '話す',
        thinkingLabel: '考え中',
        resetAria: '会話をリセット',
        speakLabel: '読む',
        userMeta: 'あなたが聞いたこと',
        relationSummary: 'ノアと少し会話した',
        relationDetail: '言葉を交わすたびに、前より自然に話せる空気ができてきた。',
        ttsSpeaker: 'noa-chat',
        chatTopicLabel: 'NOA',
    },
};

const getChatCharacterCopy = (characterId = 'noah') =>
    CHAT_CHARACTER_COPY[characterId] || CHAT_CHARACTER_COPY.noah;

const getChatEndpoints = () => {
    if (typeof window === 'undefined') {
        return ['/api/chat', CLOUDFLARE_CHAT_ENDPOINT];
    }

    const hostname = window.location.hostname || '';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return ['/api/chat', '/.netlify/functions/chat', CLOUDFLARE_CHAT_ENDPOINT];
    }

    if (hostname.endsWith('.netlify.app') || hostname.endsWith('.netlify.live')) {
        return ['/.netlify/functions/chat', '/api/chat', CLOUDFLARE_CHAT_ENDPOINT];
    }

    if (hostname.endsWith('.workers.dev')) {
        return ['/api/chat', CLOUDFLARE_CHAT_ENDPOINT];
    }

    return ['/api/chat', CLOUDFLARE_CHAT_ENDPOINT];
};

const clipText = (value, maxLength = MAX_INPUT_LENGTH) => String(value || '').trim().slice(0, maxLength);

const createAnonymousChatId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `anon-${crypto.randomUUID()}`;
    }

    return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const formatChatError = (errorMessage, endpoint) => {
    const message = String(errorMessage || '').trim();

    if (!message) {
        return '今はうまくつながらないみたい。少し時間を置いて試して。';
    }

    if (message.includes('GEMINI_API_KEY or OPENAI_API_KEY is not set on the server')) {
        return 'AIの鍵がまだ設定されていないみたい。Cloudflare の Variables and Secrets を確認しなさい。';
    }

    if (message.includes('OPENAI_API_KEY is not set on the server')) {
        return 'OpenAI の鍵がまだ設定されていないみたい。Cloudflare の Variables and Secrets を確認しなさい。';
    }

    if (message.includes('GEMINI_API_KEY')) {
        return 'Gemini の設定がまだ反映されていないみたい。Cloudflare で保存してから再デプロイしなさい。';
    }

    if (message.includes('quota') || message.includes('billing')) {
        return 'API の利用上限に当たっているみたい。課金設定か残高を確認しなさい。';
    }

    if (message.includes('Method not allowed')) {
        return `接続先は見つかっているけど、呼び方が合っていないわ。再デプロイしてからもう一度試しなさい。 (${endpoint})`;
    }

    if (message.includes('404')) {
        return `AI 用の接続先がまだ反映されていないみたい。再デプロイして更新を待ちなさい。 (${endpoint})`;
    }

    return message;
};

const buildStarterMessage = (copy) => ({
    role: 'assistant',
    content: copy.starterMessage,
    emotion: 'normal',
});

const getLastStudyTopicName = () => {
    if (typeof window === 'undefined') {
        return '';
    }

    try {
        const raw = window.localStorage.getItem('lastStudyTopic');
        if (!raw) return '';

        const parsed = JSON.parse(raw);
        return clipText(parsed?.topicName, 48);
    } catch {
        return '';
    }
};

const getNoaChatAnonymousId = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return 'anon-server';
    }

    try {
        const savedValue = window.localStorage.getItem(COMPANION_CHAT_ANONYMOUS_ID_KEY)
            || window.localStorage.getItem(LEGACY_NOA_CHAT_ANONYMOUS_ID_KEY);
        if (savedValue) return savedValue;

        const nextValue = createAnonymousChatId();
        window.localStorage.setItem(COMPANION_CHAT_ANONYMOUS_ID_KEY, nextValue);
        return nextValue;
    } catch {
        return createAnonymousChatId();
    }
};

const speakReplyWithSettings = async (text, { emotion = '', onStart, onEnd, ttsSpeaker = 'noa-chat' } = {}) => {
    const settings = getTtsSettings();
    if (!settings.enabled) return false;
    const speechProfile = buildSpeechVariationProfile(text, {
        emotion,
        browserPitch: settings.browserPitch,
        browserRate: settings.browserRate,
        speaker: ttsSpeaker,
        seedHint: emotion || ttsSpeaker,
    });

    const engineOrder = settings.engine === TTS_ENGINES.AUTO
        ? [TTS_ENGINES.DEEPGRAM, TTS_ENGINES.AIVIS, TTS_ENGINES.VOICEVOX, TTS_ENGINES.BROWSER]
        : [settings.engine];

    for (const engine of engineOrder) {
        if (engine === TTS_ENGINES.BROWSER) {
            speakWithBrowserTts(text, {
                ...speechProfile.browser,
                onStart,
                onEnd,
            });
            return true;
        }

        const baseUrl = getEngineBaseUrl(engine, settings);
        const available = await isEngineAvailable(engine, baseUrl);
        if (!available) continue;

        const speakerValue = engine === TTS_ENGINES.DEEPGRAM
            ? settings.deepgramVoiceModel
            : settings.preferredSpeaker;
        const speakerId = await resolveSpeakerIdForEngine(engine, speakerValue, {
            baseUrl,
        });
        const success = await speakWithEngine(engine, text, speakerId, {
            baseUrl,
            onStart,
            onEnd,
            audioQueryOverrides: speechProfile.engine.audioQueryOverrides,
            cacheKeyHint: speechProfile.signature,
        });
        if (success) {
            return true;
        }
    }

    speakWithBrowserTts(text, {
        ...speechProfile.browser,
        onStart,
        onEnd,
    });
    return true;
};

const requestNoaReply = async (payload) => {
    let lastError = new Error('今はうまく返事できないみたい。少し時間を置いて試して。');

    for (const endpoint of getChatEndpoints()) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const contentType = response.headers.get('content-type') || '';
            const responseBody = contentType.includes('application/json')
                ? await response.json().catch(() => ({}))
                : {};

            if (!response.ok) {
                throw new Error(
                    formatChatError(
                        responseBody.error || `サーバー応答: ${response.status}`,
                        endpoint
                    )
                );
            }

            if (responseBody.reply) {
                return responseBody;
            }

            throw new Error(`返事を受け取れなかったみたい。 (${endpoint})`);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('今はうまく返事できないみたい。少し時間を置いて試して。');
        }
    }

    throw lastError;
};

const NoaChatBox = ({
    stats,
    characterId: characterIdProp = null,
    updateStats = null,
    embedded = false,
    compact = false,
    onClose = null,
    onAssistantReply = null,
    onUserMessage = null,
    autoSpeakAssistant = false,
    onAssistantSpeechStart = null,
    onAssistantSpeechEnd = null,
}) => {
    const { acquireVoiceFocus } = useSound();
    const chatCharacterId = String(characterIdProp || stats?.characterId || 'noah').trim().toLowerCase() || 'noah';
    const chatCopy = useMemo(() => getChatCharacterCopy(chatCharacterId), [chatCharacterId]);
    const chatHistoryKey = useMemo(() => getCharacterChatTopicKey(chatCharacterId), [chatCharacterId]);
    const lastStudyTopicName = useMemo(() => getLastStudyTopicName(), []);
    const anonymousId = useMemo(() => getNoaChatAnonymousId(), []);
    const starterMessages = useMemo(() => [buildStarterMessage(chatCopy)], [chatCopy]);
    const [nowTick, setNowTick] = useState(() => Date.now());
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState(() => getNoaChatMessages(chatHistoryKey, starterMessages));
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    const [showUsageNotice, setShowUsageNotice] = useState(() => !hasAcknowledgedNoaChatNotice());
    const [compactTab, setCompactTab] = useState('chat');
    const [vocabWord, setVocabWord] = useState('');
    const [vocabMeaning, setVocabMeaning] = useState('');
    const [isVocabMeaningSuggested, setIsVocabMeaningSuggested] = useState(false);
    const [vocabFeedback, setVocabFeedback] = useState('');
    const vocabSuggestionRequestRef = useRef(0);
    const messageEndRef = useRef(null);
    const lastAssistantCallbackKeyRef = useRef('');
    const chatLimitState = useMemo(() => getNoaChatLimitSnapshot(nowTick), [nowTick]);
    const chatStatusText = chatLimitState.isDailyLimitReached
        ? chatCopy.usageLimitReached(chatLimitState.dailyLimit)
        : chatLimitState.isCoolingDown
            ? chatCopy.cooldown(Math.ceil(chatLimitState.cooldownRemainingMs / 1000))
            : chatCopy.remaining(chatLimitState.remainingCount, chatLimitState.dailyLimit);
    const noticeText = 'AIの返答には誤りがあることがあります。困ったときは保護者・先生などの大人にも相談してください。';
    const isSubmitDisabled = isLoading
        || !clipText(input)
        || chatLimitState.isDailyLimitReached
        || chatLimitState.isCoolingDown;

    useEffect(() => {
        lastAssistantCallbackKeyRef.current = '';
        setMessages(getNoaChatMessages(chatHistoryKey, starterMessages));
    }, [chatHistoryKey, starterMessages]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const intervalId = window.setInterval(() => {
            setNowTick(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [isOpen, messages, isLoading]);

    useEffect(() => {
        if (typeof onAssistantReply !== 'function' || messages.length === 0) return;

        const latestAssistantIndex = messages.findLastIndex(
            (message) => message?.role === 'assistant' && message?.content
        );
        const latestAssistantMessage = latestAssistantIndex >= 0 ? messages[latestAssistantIndex] : null;

        if (latestAssistantMessage) {
            const emotion = latestAssistantMessage.emotion
                || inferEmotionFromChatText(latestAssistantMessage.content, { role: 'assistant' });
            const callbackKey = `${latestAssistantIndex}:${latestAssistantMessage.content}:${emotion}`;

            if (lastAssistantCallbackKeyRef.current === callbackKey) {
                return;
            }

            lastAssistantCallbackKeyRef.current = callbackKey;
            onAssistantReply(latestAssistantMessage.content, {
                emotion,
                message: {
                    ...latestAssistantMessage,
                    emotion,
                },
            });
        }
    }, [messages, onAssistantReply]);

    const persistMessages = (nextMessages) => {
        const saved = saveNoaChatMessages(chatHistoryKey, nextMessages);
        setMessages(saved);
        return saved;
    };

    const handleReset = () => {
        clearNoaChatMessages(chatHistoryKey);
        lastAssistantCallbackKeyRef.current = '';
        setMessages(starterMessages);
        setError('');
    };

    const handleDismissNotice = () => {
        acknowledgeNoaChatNotice();
        setShowUsageNotice(false);
    };

    const fillSuggestedMeaningIfNeeded = async (nextWord = vocabWord, options = {}) => {
        const trimmedMeaning = String(options.meaning ?? vocabMeaning).trim();
        const trimmedWord = String(nextWord || '').trim();
        if (!trimmedWord || trimmedMeaning) {
            return trimmedMeaning;
        }

        const requestId = vocabSuggestionRequestRef.current + 1;
        vocabSuggestionRequestRef.current = requestId;
        const suggestedMeaning = await getSuggestedMeaningForCustomVocab(trimmedWord);
        if (vocabSuggestionRequestRef.current !== requestId) {
            return trimmedMeaning;
        }

        if (suggestedMeaning) {
            setVocabMeaning((currentMeaning) => currentMeaning || suggestedMeaning);
            setIsVocabMeaningSuggested(true);
            return suggestedMeaning;
        }

        return trimmedMeaning;
    };

    const handleCompactVocabSubmit = (event) => {
        event?.preventDefault?.();

        const submit = async () => {
            const nextMeaning = await fillSuggestedMeaningIfNeeded(vocabWord, { silent: true });
            const result = addCustomVocabEntry({
                word: vocabWord,
                meaning: nextMeaning,
            });

            if (!result.ok) {
                setVocabFeedback(
                    result.reason === 'duplicate'
                        ? '同じ単語と意味はもう入っています。'
                        : '英単語と意味の両方を入れてください。'
                );
                return;
            }

            vocabSuggestionRequestRef.current += 1;
            setVocabWord('');
            setVocabMeaning('');
            setIsVocabMeaningSuggested(false);
            setVocabFeedback(`「${result.entry.word}」を追加しました。`);
        };

        void submit();
    };

    const handleSpeak = async (text, emotion = '') => {
        if (!text || isSpeaking) return;

        setIsSpeaking(true);
        try {
            const releaseVoiceFocus = acquireVoiceFocus();
            const started = await speakReplyWithSettings(text, {
                emotion,
                ttsSpeaker: chatCopy.ttsSpeaker,
                onStart: () => onAssistantSpeechStart?.(text),
                onEnd: () => {
                    releaseVoiceFocus();
                    onAssistantSpeechEnd?.(text);
                },
            });
            if (!started) {
                releaseVoiceFocus();
            }
        } finally {
            setIsSpeaking(false);
        }
    };

    const handleSubmit = async (event) => {
        event?.preventDefault?.();
        const trimmed = clipText(input);
        if (!trimmed || isLoading) return;

        const limitSnapshot = getNoaChatLimitSnapshot();
        if (limitSnapshot.isDailyLimitReached) {
            setNowTick(Date.now());
            setError(chatCopy.usageLimitReached(limitSnapshot.dailyLimit));
            return;
        }

        if (limitSnapshot.isCoolingDown) {
            setNowTick(Date.now());
            setError(chatCopy.cooldown(Math.ceil(limitSnapshot.cooldownRemainingMs / 1000)));
            return;
        }

        const userEmotion = inferEmotionFromChatText(trimmed, { role: 'user' });
        const userMessage = { role: 'user', content: trimmed, emotion: userEmotion };
        onUserMessage?.(trimmed, {
            emotion: userEmotion,
            message: userMessage,
        });
        const nextMessages = [...messages, userMessage];
        persistMessages(nextMessages);
        setInput('');
        setError('');
        setIsLoading(true);
        markNoaChatAttempt();
        setNowTick(Date.now());

        try {
            const payload = await requestNoaReply({
                message: trimmed,
                lastStudyTopic: lastStudyTopicName,
                affection: stats?.affection || 0,
                recentMessages: nextMessages,
                anonymousId,
                characterId: chatCharacterId,
                characterName: chatCopy.displayName,
            });

            const assistantMessage = {
                role: 'assistant',
                content: clipText(payload.reply, 320),
                emotion: payload.emotion || inferEmotionFromChatText(payload.reply, { role: 'assistant' }),
            };

            const saved = saveNoaChatMessages(chatHistoryKey, [...nextMessages, assistantMessage]);
            setMessages(saved);
            recordSuccessfulNoaChatTurn();
            setNowTick(Date.now());
            if (typeof updateStats === 'function') {
                updateStats((currentStats) => applyRelationshipActivity(currentStats, {
                    type: 'chat',
                    summary: chatCopy.relationSummary,
                    detail: chatCopy.relationDetail,
                }).nextStats);
            }
            if (autoSpeakAssistant) {
                setIsSpeaking(true);
                try {
                    const releaseVoiceFocus = acquireVoiceFocus();
                    const started = await speakReplyWithSettings(assistantMessage.content, {
                        emotion: assistantMessage.emotion,
                        ttsSpeaker: chatCopy.ttsSpeaker,
                        onStart: () => onAssistantSpeechStart?.(assistantMessage.content),
                        onEnd: () => {
                            releaseVoiceFocus();
                            onAssistantSpeechEnd?.(assistantMessage.content);
                        },
                    });
                    if (!started) {
                        releaseVoiceFocus();
                    }
                } finally {
                    setIsSpeaking(false);
                }
            }
        } catch (requestError) {
            setMessages(nextMessages);
            setError(requestError.message || '今は返事できないみたい。Cloudflare Functions と API キーを確認して。');
            setNowTick(Date.now());
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (embedded) {
            onClose?.();
            return;
        }
        setIsOpen(false);
    };

    const isPanelVisible = embedded || isOpen;
    const isCompact = compact && !embedded;

    return (
        <div className={`noa-chat-shell ${embedded ? 'is-embedded' : ''} ${isCompact ? 'is-compact' : ''}`}>
            {isCompact ? (
                <section className="noa-chat-bar" aria-label={chatCopy.launcherLabel}>
                    <div className="noa-chat-bar-header">
                        <div className="noa-chat-bar-title-row">
                            <div className="noa-chat-bar-title-group">
                                <span className="noa-chat-bar-label">{chatCopy.launcherLabel}</span>
                                {compactTab === 'chat' && (
                                    <p className="noa-chat-status is-compact">{chatStatusText}</p>
                                )}
                            </div>
                            <div className="noa-chat-bar-tabs" role="tablist" aria-label="ホーム下の機能切り替え">
                                <button
                                    type="button"
                                    className={`noa-chat-bar-tab ${compactTab === 'chat' ? 'is-active' : ''}`}
                                    onClick={() => setCompactTab('chat')}
                                    aria-pressed={compactTab === 'chat'}
                                >
                                    会話
                                </button>
                                <button
                                    type="button"
                                    className={`noa-chat-bar-tab ${compactTab === 'vocab' ? 'is-active' : ''}`}
                                    onClick={() => setCompactTab('vocab')}
                                    aria-pressed={compactTab === 'vocab'}
                                >
                                    単語追加
                                </button>
                            </div>
                        </div>
                    </div>

                    {compactTab === 'chat' ? (
                        <>
                            {error && <p className="noa-chat-error is-compact">{error}</p>}

                            <form className="noa-chat-bar-form" onSubmit={handleSubmit}>
                                {showUsageNotice && (
                                    <div className="noa-chat-notice is-compact" role="note">
                                        <p>{noticeText}</p>
                                        <button type="button" className="noa-chat-notice-btn" onClick={handleDismissNotice}>
                                            了解
                                        </button>
                                    </div>
                                )}
                                <div className="noa-chat-bar-row">
                                    <textarea
                                        id="noa-chat-input-compact"
                                        className="noa-chat-input is-compact"
                                        value={input}
                                        onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_LENGTH))}
                                        placeholder={chatCopy.placeholderCompact}
                                        rows={1}
                                    />
                                    <button type="submit" className="noa-chat-submit is-compact" disabled={isSubmitDisabled}>
                                        {isLoading ? <LoaderCircle size={16} className="noa-chat-spinner" /> : <SendHorizontal size={16} />}
                                        <span>{isLoading ? chatCopy.thinkingLabel : chatCopy.submitLabel}</span>
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <form className="noa-chat-bar-form noa-chat-vocab-form" onSubmit={handleCompactVocabSubmit}>
                            <div className="noa-chat-vocab-fields">
                                <input
                                    id="noa-chat-vocab-word"
                                    className="noa-chat-input noa-chat-vocab-input is-compact"
                                    type="text"
                                    value={vocabWord}
                                    onChange={(event) => {
                                        vocabSuggestionRequestRef.current += 1;
                                        if (isVocabMeaningSuggested) {
                                            setVocabMeaning('');
                                            setIsVocabMeaningSuggested(false);
                                        }
                                        setVocabWord(event.target.value);
                                        setVocabFeedback('');
                                    }}
                                    onBlur={() => {
                                        void fillSuggestedMeaningIfNeeded(vocabWord);
                                    }}
                                    placeholder="英単語・熟語"
                                />
                                <input
                                    className="noa-chat-input noa-chat-vocab-input is-compact"
                                    type="text"
                                    value={vocabMeaning}
                                    onChange={(event) => {
                                        setVocabMeaning(event.target.value);
                                        setIsVocabMeaningSuggested(false);
                                        setVocabFeedback('');
                                    }}
                                    placeholder="意味"
                                />
                                <button type="submit" className="noa-chat-submit is-compact">
                                    追加
                                </button>
                            </div>
                            {vocabFeedback && <p className="noa-chat-feedback is-compact">{vocabFeedback}</p>}
                        </form>
                    )}
                </section>
            ) : isPanelVisible ? (
                <section className={`noa-chat-panel ${embedded ? 'is-embedded' : ''}`} aria-label={chatCopy.panelLabel}>
                    <header className="noa-chat-header">
                        <div className="noa-chat-heading">
                            <h2 className="noa-chat-title">{chatCopy.displayName}</h2>
                            <p className="noa-chat-status">{chatStatusText}</p>
                        </div>
                        <div className="noa-chat-actions">
                            <button type="button" className="noa-chat-icon-btn" onClick={handleReset} aria-label={chatCopy.resetAria}>
                                <RefreshCcw size={16} />
                            </button>
                            <button type="button" className="noa-chat-icon-btn" onClick={handleClose} aria-label="閉じる">
                                <X size={18} />
                            </button>
                        </div>
                    </header>

                    <div className="noa-chat-messages">
                        {messages.map((message, index) => (
                            <article
                                key={`${message.role}-${index}-${message.content.slice(0, 16)}`}
                                className={`noa-chat-message ${message.role === 'user' ? 'is-user' : 'is-assistant'}`}
                            >
                                <div className="noa-chat-message-meta">
                                    <span>{message.role === 'user' ? chatCopy.userMeta : chatCopy.shortName}</span>
                                    {message.role === 'assistant' && (
                                        <button
                                            type="button"
                                            className="noa-chat-voice-btn"
                                            onClick={() => handleSpeak(message.content, message.emotion)}
                                            disabled={isSpeaking}
                                        >
                                            <Volume2 size={14} />
                                            <span>{chatCopy.speakLabel}</span>
                                        </button>
                                    )}
                                </div>
                                <p>{message.content}</p>
                            </article>
                        ))}

                        {isLoading && (
                            <div className="noa-chat-loading">
                                <LoaderCircle size={16} className="noa-chat-spinner" />
                                <span>{chatCopy.loading}</span>
                            </div>
                        )}

                        <div ref={messageEndRef} />
                    </div>

                    {showUsageNotice && (
                        <div className="noa-chat-notice" role="note">
                            <p>{noticeText}</p>
                            <button type="button" className="noa-chat-notice-btn" onClick={handleDismissNotice}>
                                了解
                            </button>
                        </div>
                    )}

                    {error && <p className="noa-chat-error">{error}</p>}

                    <form className="noa-chat-form" onSubmit={handleSubmit}>
                        <label className="noa-chat-label" htmlFor="noa-chat-input">
                            {chatCopy.launcherLabel}
                        </label>
                        <textarea
                            id="noa-chat-input"
                            className="noa-chat-input"
                            value={input}
                            onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_LENGTH))}
                            placeholder={chatCopy.placeholderFull}
                            rows={3}
                        />
                        <div className="noa-chat-form-footer">
                            <div className="noa-chat-form-meta">
                                <span className="noa-chat-counter">{input.length}/{MAX_INPUT_LENGTH}</span>
                                <span className="noa-chat-remaining">残り {chatLimitState.remainingCount} 回</span>
                            </div>
                            <button type="submit" className="noa-chat-submit" disabled={isSubmitDisabled}>
                                <SendHorizontal size={16} />
                                <span>{chatCopy.submitLabel}</span>
                            </button>
                        </div>
                    </form>
                </section>
            ) : null}
        </div>
    );
};

export default NoaChatBox;
