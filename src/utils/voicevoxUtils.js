/**
 * TTS連携ユーティリティ
 * Deepgram / VOICEVOX / AivisSpeech / ブラウザTTS を扱う
 */

import { Capacitor } from '@capacitor/core';
import { getTtsSettings, TTS_ENGINES } from './ttsSettings';
import { estimateSpeechDuration } from './lipSync';

const DEFAULT_ENGINE_BASE_URLS = {
    [TTS_ENGINES.DEEPGRAM]: '/api/tts',
    [TTS_ENGINES.AIVIS]: 'http://127.0.0.1:10101',
    [TTS_ENGINES.VOICEVOX]: 'http://127.0.0.1:50021',
};

const CLOUDFLARE_TTS_ENDPOINT = 'https://study-musume.hide20080422.workers.dev/api/tts';

export const DEEPGRAM_VOICE_MODELS = [
    'aura-2-uzume-ja',
    'aura-2-ama-ja',
    'aura-2-izanami-ja',
    'aura-2-fujin-ja',
    'aura-2-ebisu-ja',
    'aura-2-thalia-en',
    'aura-2-luna-en',
];

export const VOICEVOX_SPEAKERS = {
    ZUNDAMON: 3,
    ZUNDAMON_SWEET: 1,
    METAN: 2,
    TSUMUGI: 8,
    RITSU: 9,
};

const VOICEVOX_SPEAKER_ALIASES = {
    zundamon: VOICEVOX_SPEAKERS.ZUNDAMON,
    zundamon_sweet: VOICEVOX_SPEAKERS.ZUNDAMON_SWEET,
    sweet: VOICEVOX_SPEAKERS.ZUNDAMON_SWEET,
    metan: VOICEVOX_SPEAKERS.METAN,
    tsumugi: VOICEVOX_SPEAKERS.TSUMUGI,
    ritsu: VOICEVOX_SPEAKERS.RITSU,
    ずんだもん: VOICEVOX_SPEAKERS.ZUNDAMON,
    四国めたん: VOICEVOX_SPEAKERS.METAN,
    春日部つむぎ: VOICEVOX_SPEAKERS.TSUMUGI,
    雨晴はう: VOICEVOX_SPEAKERS.RITSU,
};

const DISABLED_TTS_VALUES = new Set(['0', 'false', 'off', 'no', 'mute', 'none', 'disabled']);
const audioCache = new Map();
const speakerListCache = new Map();
const speakerListPromiseCache = new Map();

const getDeepgramEndpoints = () => {
    if (typeof window === 'undefined') {
        return [DEFAULT_ENGINE_BASE_URLS[TTS_ENGINES.DEEPGRAM], CLOUDFLARE_TTS_ENDPOINT];
    }

    const hostname = window.location.hostname || '';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return [DEFAULT_ENGINE_BASE_URLS[TTS_ENGINES.DEEPGRAM], '/.netlify/functions/tts', CLOUDFLARE_TTS_ENDPOINT];
    }

    if (hostname.endsWith('.netlify.app') || hostname.endsWith('.netlify.live')) {
        return ['/.netlify/functions/tts', DEFAULT_ENGINE_BASE_URLS[TTS_ENGINES.DEEPGRAM], CLOUDFLARE_TTS_ENDPOINT];
    }

    return [DEFAULT_ENGINE_BASE_URLS[TTS_ENGINES.DEEPGRAM], CLOUDFLARE_TTS_ENDPOINT];
};

const getUniqueValues = (values = []) => [...new Set(values.filter(Boolean))];

const getDeepgramVoiceModel = (value, settings = getTtsSettings()) => {
    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }

    if (typeof settings?.deepgramVoiceModel === 'string' && settings.deepgramVoiceModel.trim()) {
        return settings.deepgramVoiceModel.trim();
    }

    return DEEPGRAM_VOICE_MODELS[0];
};

const normalizeSpeakerKey = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[／/]/g, '/')
    .replace(/\s+/g, ' ');

export const shouldAutoSpeakLine = (line) => {
    if (!line?.text) return false;
    if (line.speaker === 'Quiz' || line.speaker === 'System') return false;
    if (line.voice) return false;

    const rawValue = line.tts ?? line.auto_tts ?? '';
    if (!rawValue) return true;

    return !DISABLED_TTS_VALUES.has(String(rawValue).trim().toLowerCase());
};

export const resolveVoicevoxSpeakerId = (value, fallbackSpeakerId = VOICEVOX_SPEAKERS.METAN) => {
    if (value === undefined || value === null || value === '') {
        return fallbackSpeakerId;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();
    if (VOICEVOX_SPEAKER_ALIASES[normalized]) {
        return VOICEVOX_SPEAKER_ALIASES[normalized];
    }

    const numericValue = Number(normalized);
    if (Number.isFinite(numericValue)) {
        return numericValue;
    }

    return fallbackSpeakerId;
};

export const getEngineDisplayName = (engine) => {
    if (engine === TTS_ENGINES.DEEPGRAM) return 'Deepgram';
    if (engine === TTS_ENGINES.AIVIS) return 'AivisSpeech';
    if (engine === TTS_ENGINES.VOICEVOX) return 'VOICEVOX';
    if (engine === TTS_ENGINES.BROWSER) return 'ブラウザTTS';
    return '自動判定';
};

export const getEngineBaseUrl = (engine, settings = getTtsSettings()) => {
    if (engine === TTS_ENGINES.DEEPGRAM) {
        return DEFAULT_ENGINE_BASE_URLS[TTS_ENGINES.DEEPGRAM];
    }
    if (engine === TTS_ENGINES.AIVIS) {
        return settings.aivisUrl || DEFAULT_ENGINE_BASE_URLS[TTS_ENGINES.AIVIS];
    }
    if (engine === TTS_ENGINES.VOICEVOX) {
        return settings.voicevoxUrl || DEFAULT_ENGINE_BASE_URLS[TTS_ENGINES.VOICEVOX];
    }
    return '';
};

export const isEngineAvailable = async (engine = TTS_ENGINES.VOICEVOX, baseUrl = getEngineBaseUrl(engine)) => {
    if (engine === TTS_ENGINES.DEEPGRAM) {
        const endpoints = getUniqueValues([baseUrl, ...getDeepgramEndpoints()]);
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, { method: 'GET' });
                if (!response.ok) continue;

                const data = await response.json().catch(() => null);
                if (data?.ok) return true;
            } catch {
                // try next endpoint
            }
        }
        return false;
    }

    if (!baseUrl) return false;
    try {
        const response = await fetch(`${baseUrl}/version`, { method: 'GET' });
        return response.ok;
    } catch {
        return false;
    }
};

export const isVoicevoxAvailable = async () => isEngineAvailable(TTS_ENGINES.VOICEVOX);

const createCacheKey = (engine, text, speakerId, baseUrl) => `${engine}_${baseUrl}_${text}_${speakerId}`;

export const fetchEngineSpeakers = async (engine = TTS_ENGINES.VOICEVOX, baseUrl = getEngineBaseUrl(engine)) => {
    if (!baseUrl || engine === TTS_ENGINES.BROWSER || engine === TTS_ENGINES.DEEPGRAM) return [];

    const cacheKey = `${engine}:${baseUrl}`;
    if (speakerListCache.has(cacheKey)) {
        return speakerListCache.get(cacheKey);
    }

    if (speakerListPromiseCache.has(cacheKey)) {
        return speakerListPromiseCache.get(cacheKey);
    }

    try {
        const speakerPromise = fetch(`${baseUrl}/speakers`)
            .then(async (response) => {
                if (!response.ok) return [];
                const data = await response.json();
                const speakers = data.flatMap((speaker) =>
                    (speaker.styles || []).map((style) => ({
                        engine,
                        speakerName: speaker.name,
                        styleName: style.name,
                        styleId: style.id,
                        displayName: `${speaker.name} / ${style.name}`,
                    }))
                );
                speakerListCache.set(cacheKey, speakers);
                return speakers;
            })
            .finally(() => {
                speakerListPromiseCache.delete(cacheKey);
            });

        speakerListPromiseCache.set(cacheKey, speakerPromise);
        return speakerPromise;
    } catch {
        return [];
    }
};

export const resolveSpeakerIdForEngine = async (
    engine = TTS_ENGINES.VOICEVOX,
    value,
    { fallbackSpeakerId, baseUrl = getEngineBaseUrl(engine) } = {}
) => {
    if (engine === TTS_ENGINES.DEEPGRAM) {
        return getDeepgramVoiceModel(value);
    }

    const resolvedId = resolveVoicevoxSpeakerId(value, undefined);
    if (resolvedId !== undefined) {
        return resolvedId;
    }

    if (!value || engine === TTS_ENGINES.BROWSER || !baseUrl) {
        return fallbackSpeakerId;
    }

    const normalized = normalizeSpeakerKey(value);
    if (!normalized) {
        return fallbackSpeakerId;
    }

    const speakers = await fetchEngineSpeakers(engine, baseUrl);
    const exactMatch = speakers.find((speaker) => {
        const speakerName = normalizeSpeakerKey(speaker.speakerName);
        const styleName = normalizeSpeakerKey(speaker.styleName);
        const displayName = normalizeSpeakerKey(speaker.displayName);
        return normalized === displayName
            || normalized === `${speakerName}/${styleName}`
            || normalized === speakerName
            || normalized === styleName;
    });

    if (exactMatch) {
        return exactMatch.styleId;
    }

    const partialMatch = speakers.find((speaker) => {
        const speakerName = normalizeSpeakerKey(speaker.speakerName);
        const styleName = normalizeSpeakerKey(speaker.styleName);
        return speakerName.includes(normalized)
            || normalized.includes(speakerName)
            || styleName.includes(normalized)
            || normalized.includes(styleName);
    });

    return partialMatch?.styleId ?? fallbackSpeakerId;
};

export const speakWithEngine = async (
    engine = TTS_ENGINES.VOICEVOX,
    text,
    speakerId = VOICEVOX_SPEAKERS.ZUNDAMON,
    { baseUrl = getEngineBaseUrl(engine), onStart, onEnd } = {}
) => {
    try {
        if (engine === TTS_ENGINES.DEEPGRAM) {
            const settings = getTtsSettings();
            const model = getDeepgramVoiceModel(speakerId, settings);
            const endpoints = getUniqueValues([baseUrl, ...getDeepgramEndpoints()]);
            let lastError = null;

            for (const endpoint of endpoints) {
                try {
                    const cacheKey = createCacheKey(engine, text, model, endpoint);
                    if (audioCache.has(cacheKey)) {
                        const audioBlob = audioCache.get(cacheKey);
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        let started = false;
                        const handleStart = () => {
                            if (started) return;
                            started = true;
                            onStart?.();
                        };
                        const handleEnd = () => {
                            URL.revokeObjectURL(audioUrl);
                            onEnd?.();
                        };

                        audio.addEventListener('play', handleStart, { once: true });
                        audio.addEventListener('ended', handleEnd, { once: true });
                        audio.addEventListener('error', handleEnd, { once: true });
                        await audio.play();
                        handleStart();
                        return true;
                    }

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text,
                            model,
                        }),
                    });
                    if (!response.ok) {
                        throw new Error(`TTS request failed: ${response.status}`);
                    }

                    const audioBlob = await response.blob();
                    audioCache.set(cacheKey, audioBlob);

                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audio = new Audio(audioUrl);
                    let started = false;
                    const handleStart = () => {
                        if (started) return;
                        started = true;
                        onStart?.();
                    };
                    const handleEnd = () => {
                        URL.revokeObjectURL(audioUrl);
                        onEnd?.();
                    };

                    audio.addEventListener('play', handleStart, { once: true });
                    audio.addEventListener('ended', handleEnd, { once: true });
                    audio.addEventListener('error', handleEnd, { once: true });
                    await audio.play();
                    handleStart();
                    return true;
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError || new Error('No Deepgram endpoint available');
        }

        if (!baseUrl) return false;

        const cacheKey = createCacheKey(engine, text, speakerId, baseUrl);
        if (audioCache.has(cacheKey)) {
            const audioBlob = audioCache.get(cacheKey);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            let started = false;
            const handleStart = () => {
                if (started) return;
                started = true;
                onStart?.();
            };
            const handleEnd = () => {
                URL.revokeObjectURL(audioUrl);
                onEnd?.();
            };

            audio.addEventListener('play', handleStart, { once: true });
            audio.addEventListener('ended', handleEnd, { once: true });
            audio.addEventListener('error', handleEnd, { once: true });
            await audio.play();
            handleStart();
            return true;
        }

        const queryResponse = await fetch(
            `${baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
            { method: 'POST' }
        );
        if (!queryResponse.ok) throw new Error('Audio query failed');

        const audioQuery = await queryResponse.json();
        const synthesisResponse = await fetch(
            `${baseUrl}/synthesis?speaker=${speakerId}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(audioQuery),
            }
        );
        if (!synthesisResponse.ok) throw new Error('Audio synthesis failed');

        const audioBlob = await synthesisResponse.blob();
        audioCache.set(cacheKey, audioBlob);

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        let started = false;
        const handleStart = () => {
            if (started) return;
            started = true;
            onStart?.();
        };
        const handleEnd = () => {
            URL.revokeObjectURL(audioUrl);
            onEnd?.();
        };

        audio.addEventListener('play', handleStart, { once: true });
        audio.addEventListener('ended', handleEnd, { once: true });
        audio.addEventListener('error', handleEnd, { once: true });
        await audio.play();
        handleStart();
        return true;
    } catch (error) {
        console.warn(`${getEngineDisplayName(engine)} synthesis failed:`, error);
        return false;
    }
};

export const speakWithVoicevox = async (text, speakerId = VOICEVOX_SPEAKERS.ZUNDAMON, options = {}) =>
    speakWithEngine(TTS_ENGINES.VOICEVOX, text, speakerId, options);

export const prefetchEngine = async (
    engine = TTS_ENGINES.VOICEVOX,
    text,
    speakerId = VOICEVOX_SPEAKERS.ZUNDAMON,
    { baseUrl = getEngineBaseUrl(engine) } = {}
) => {
    try {
        if (engine === TTS_ENGINES.DEEPGRAM) {
            const settings = getTtsSettings();
            const model = getDeepgramVoiceModel(speakerId, settings);
            const endpoints = getUniqueValues([baseUrl, ...getDeepgramEndpoints()]);

            for (const endpoint of endpoints) {
                try {
                    const cacheKey = createCacheKey(engine, text, model, endpoint);
                    if (audioCache.has(cacheKey)) return true;

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text,
                            model,
                        }),
                    });
                    if (!response.ok) continue;

                    const audioBlob = await response.blob();
                    audioCache.set(cacheKey, audioBlob);
                    return true;
                } catch {
                    // try next endpoint
                }
            }

            return false;
        }

        if (!baseUrl) return false;

        const cacheKey = createCacheKey(engine, text, speakerId, baseUrl);
        if (audioCache.has(cacheKey)) return true;

        const queryResponse = await fetch(
            `${baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
            { method: 'POST' }
        );
        if (!queryResponse.ok) return false;

        const audioQuery = await queryResponse.json();
        const synthesisResponse = await fetch(
            `${baseUrl}/synthesis?speaker=${speakerId}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(audioQuery),
            }
        );
        if (!synthesisResponse.ok) return false;

        const audioBlob = await synthesisResponse.blob();
        audioCache.set(cacheKey, audioBlob);
        return true;
    } catch {
        return false;
    }
};

export const prefetchVoicevox = async (text, speakerId = VOICEVOX_SPEAKERS.ZUNDAMON, options = {}) =>
    prefetchEngine(TTS_ENGINES.VOICEVOX, text, speakerId, options);

export const preloadCommonPhrases = async (speakerId = VOICEVOX_SPEAKERS.METAN) => {
    const commonPhrases = ['正解！', 'もう一度頑張って。'];

    for (const phrase of commonPhrases) {
        try {
            await prefetchVoicevox(phrase, speakerId);
        } catch (error) {
            console.warn(`Failed to preload: ${phrase}`, error);
        }
    }
};

export const speakWithBrowserTts = (text, { pitch = 1.3, rate = 1.0, isMale = false, onStart, onEnd } = {}) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.pitch = pitch;
    utterance.rate = rate;
    const estimatedDurationMs = Math.max(1400, estimateSpeechDuration(text) * 1000);
    let started = false;
    let finished = false;
    let monitorId = null;
    let fallbackId = null;
    let startTime = 0;

    const voices = window.speechSynthesis.getVoices();
    const jaVoices = voices.filter((voice) => voice.lang.startsWith('ja'));

    let selectedVoice = null;
    if (isMale) {
        selectedVoice = jaVoices.find((voice) =>
            voice.name.includes('Male') || voice.name.includes('Man') || voice.name.includes('男性') || voice.name.includes('Ichiro')
        );
    } else {
        selectedVoice = jaVoices.find((voice) =>
            voice.name.includes('Female') || voice.name.includes('female') ||
            voice.name.includes('女性') || voice.name.includes('Kyoko') ||
            voice.name.includes('Otoya') || voice.name.includes('Google 日本語')
        ) || jaVoices[0];
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    const stopMonitoring = () => {
        if (monitorId) {
            window.clearInterval(monitorId);
            monitorId = null;
        }
        if (fallbackId) {
            window.clearTimeout(fallbackId);
            fallbackId = null;
        }
    };

    const finishSpeech = () => {
        if (finished) return;
        finished = true;
        stopMonitoring();
        onEnd?.();
    };

    const startMonitoring = () => {
        stopMonitoring();

        monitorId = window.setInterval(() => {
            if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
                finishSpeech();
            }
        }, 120);

        fallbackId = window.setTimeout(() => {
            finishSpeech();
        }, estimatedDurationMs + 1200);
    };

    const handleStart = () => {
        if (started) return;
        started = true;
        startTime = performance.now();
        onStart?.();
        startMonitoring();
    };

    utterance.onstart = handleStart;
    utterance.onboundary = handleStart;
    utterance.onend = () => {
        const elapsedMs = startTime ? performance.now() - startTime : 0;
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            return;
        }
        if (started && elapsedMs < Math.min(estimatedDurationMs * 0.35, 700)) {
            return;
        }
        finishSpeech();
    };
    utterance.onerror = () => {
        finishSpeech();
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return utterance;
};

export const speakWithPreferredTts = async (text, settings = getTtsSettings()) => {
    if (!text || settings?.enabled === false) return false;

    const engineOrder = settings.engine === TTS_ENGINES.AUTO
        ? [TTS_ENGINES.DEEPGRAM, TTS_ENGINES.AIVIS, TTS_ENGINES.VOICEVOX, TTS_ENGINES.BROWSER]
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

        const speakerId = await resolveSpeakerIdForEngine(
            engine,
            engine === TTS_ENGINES.DEEPGRAM ? settings.deepgramVoiceModel : settings.preferredSpeaker,
            {
                baseUrl,
            }
        );
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

export const speak = async (text, speakerId = VOICEVOX_SPEAKERS.ZUNDAMON) => {
    const isNativePlatform = Capacitor.isNativePlatform();
    let success = false;

    if (!isNativePlatform) {
        success = await speakWithVoicevox(text, speakerId);
    }

    if (!success) {
        speakWithBrowserTts(text);
    }
};
