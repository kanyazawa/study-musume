import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, MessageCircle, RefreshCcw, SendHorizontal, Volume2, X } from 'lucide-react';
import './NoaChatBox.css';
import { getLastStudyTopic } from '../data/studyData';
import { clearNoaChatMessages, getNoaChatMessages, saveNoaChatMessages } from '../utils/chatHistory';
import { getTtsSettings, TTS_ENGINES } from '../utils/ttsSettings';
import {
    getEngineBaseUrl,
    isEngineAvailable,
    resolveSpeakerIdForEngine,
    speakWithBrowserTts,
    speakWithEngine,
} from '../utils/voicevoxUtils';

const MAX_INPUT_LENGTH = 240;
const CLOUDFLARE_CHAT_ENDPOINT = 'https://study-musume.hide20080422.workers.dev/api/chat';

const getChatEndpoints = () => {
    if (typeof window === 'undefined') {
        return [CLOUDFLARE_CHAT_ENDPOINT];
    }

    const hostname = window.location.hostname || '';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return ['/api/chat', '/.netlify/functions/chat', CLOUDFLARE_CHAT_ENDPOINT];
    }

    if (hostname.endsWith('.workers.dev')) {
        return ['/api/chat', CLOUDFLARE_CHAT_ENDPOINT];
    }

    return [CLOUDFLARE_CHAT_ENDPOINT];
};

const clipText = (value, maxLength = MAX_INPUT_LENGTH) => String(value || '').trim().slice(0, maxLength);

const formatChatError = (errorMessage, endpoint) => {
    const message = String(errorMessage || '').trim();

    if (!message) {
        return '今はうまくつながらないわ。少し時間を置いて試しなさい。';
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

const buildStarterMessage = (topicName) => ({
    role: 'assistant',
    content: topicName
        ? `${topicName}で詰まったところ、短く一緒に整理するわ。1つずつ聞きなさい。`
        : '勉強で詰まったところを、短く一緒に整理するわ。気になるところを聞きなさい。',
});

const buildTopicMeta = () => {
    try {
        const lastTopic = getLastStudyTopic();
        return {
            key: lastTopic?.topicName || 'default',
            label: lastTopic?.topicName || '最近の勉強',
        };
    } catch {
        return {
            key: 'default',
            label: '最近の勉強',
        };
    }
};

const speakReplyWithSettings = async (text) => {
    const settings = getTtsSettings();
    if (!settings.enabled) return false;

    const engineOrder = settings.engine === TTS_ENGINES.AUTO
        ? [TTS_ENGINES.AIVIS, TTS_ENGINES.VOICEVOX, TTS_ENGINES.BROWSER]
        : [settings.engine];

    for (const engine of engineOrder) {
        if (engine === TTS_ENGINES.BROWSER) {
            speakWithBrowserTts(text, {
                pitch: settings.browserPitch,
                rate: settings.browserRate,
            });
            return true;
        }

        const baseUrl = getEngineBaseUrl(engine, settings);
        const available = await isEngineAvailable(engine, baseUrl);
        if (!available) continue;

        const speakerId = await resolveSpeakerIdForEngine(engine, settings.preferredSpeaker, {
            baseUrl,
        });
        const success = await speakWithEngine(engine, text, speakerId, { baseUrl });
        if (success) {
            return true;
        }
    }

    speakWithBrowserTts(text, {
        pitch: settings.browserPitch,
        rate: settings.browserRate,
    });
    return true;
};

const requestNoaReply = async (payload) => {
    let lastError = new Error('ノアへの接続に失敗したわ。');

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

            throw new Error(`ノアの返事を受け取れなかったわ。 (${endpoint})`);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('ノアへの接続に失敗したわ。');
        }
    }

    throw lastError;
};

const NoaChatBox = ({ stats, embedded = false, onClose = null }) => {
    const topicMeta = useMemo(() => buildTopicMeta(), []);
    const starterMessages = useMemo(() => [buildStarterMessage(topicMeta.label)], [topicMeta.label]);
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState(() => getNoaChatMessages(topicMeta.key, starterMessages));
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    const messageEndRef = useRef(null);

    useEffect(() => {
        setMessages(getNoaChatMessages(topicMeta.key, starterMessages));
    }, [starterMessages, topicMeta.key]);

    useEffect(() => {
        if (!isOpen) return;
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [isOpen, messages, isLoading]);

    const persistMessages = (nextMessages) => {
        const saved = saveNoaChatMessages(topicMeta.key, nextMessages);
        setMessages(saved);
        return saved;
    };

    const handleReset = () => {
        clearNoaChatMessages(topicMeta.key);
        setMessages(starterMessages);
        setError('');
    };

    const handleSpeak = async (text) => {
        if (!text || isSpeaking) return;

        setIsSpeaking(true);
        try {
            await speakReplyWithSettings(text);
        } finally {
            setIsSpeaking(false);
        }
    };

    const handleSubmit = async (event) => {
        event?.preventDefault?.();
        const trimmed = clipText(input);
        if (!trimmed || isLoading) return;

        const userMessage = { role: 'user', content: trimmed };
        const nextMessages = [...messages, userMessage];
        persistMessages(nextMessages);
        setInput('');
        setError('');
        setIsLoading(true);

        try {
            const payload = await requestNoaReply({
                message: trimmed,
                topic: topicMeta.label,
                affection: stats?.affection || 0,
                recentMessages: nextMessages,
            });

            const assistantMessage = {
                role: 'assistant',
                content: clipText(payload.reply, 320),
            };

            const saved = saveNoaChatMessages(topicMeta.key, [...nextMessages, assistantMessage]);
            setMessages(saved);
        } catch (requestError) {
            setMessages(nextMessages);
            setError(requestError.message || '今は返事できないみたい。Cloudflare Functions と API キーを確認して。');
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

    return (
        <div className={`noa-chat-shell ${embedded ? 'is-embedded' : ''}`}>
            {isPanelVisible ? (
                <section className={`noa-chat-panel ${embedded ? 'is-embedded' : ''}`} aria-label="ノア">
                    <header className="noa-chat-header">
                        <div>
                            <div className="noa-chat-badge">NOA CHAT</div>
                            <h2 className="noa-chat-title">ノア</h2>
                            <p className="noa-chat-topic">最近の勉強: {topicMeta.label}</p>
                        </div>
                        <div className="noa-chat-actions">
                            <button type="button" className="noa-chat-icon-btn" onClick={handleReset} aria-label="会話をリセット">
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
                                    <span>{message.role === 'user' ? 'あなた' : 'ノア'}</span>
                                    {message.role === 'assistant' && (
                                        <button
                                            type="button"
                                            className="noa-chat-voice-btn"
                                            onClick={() => handleSpeak(message.content)}
                                            disabled={isSpeaking}
                                        >
                                            <Volume2 size={14} />
                                            <span>読む</span>
                                        </button>
                                    )}
                                </div>
                                <p>{message.content}</p>
                            </article>
                        ))}

                        {isLoading && (
                            <div className="noa-chat-loading">
                                <LoaderCircle size={16} className="noa-chat-spinner" />
                                <span>ノアが考え中...</span>
                            </div>
                        )}

                        <div ref={messageEndRef} />
                    </div>

                    {error && <p className="noa-chat-error">{error}</p>}

                    <form className="noa-chat-form" onSubmit={handleSubmit}>
                        <label className="noa-chat-label" htmlFor="noa-chat-input">
                            むずかしかったところを1つだけ聞く
                        </label>
                        <textarea
                            id="noa-chat-input"
                            className="noa-chat-input"
                            value={input}
                            onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_LENGTH))}
                            placeholder="例: the と a の違いってどう覚えればいい？"
                            rows={3}
                        />
                        <div className="noa-chat-form-footer">
                            <span className="noa-chat-counter">{input.length}/{MAX_INPUT_LENGTH}</span>
                            <button type="submit" className="noa-chat-submit" disabled={isLoading || !clipText(input)}>
                                <SendHorizontal size={16} />
                                <span>送る</span>
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <button type="button" className="noa-chat-launcher" onClick={() => setIsOpen(true)}>
                    <MessageCircle size={18} />
                    <span>ノア</span>
                </button>
            )}
        </div>
    );
};

export default NoaChatBox;
