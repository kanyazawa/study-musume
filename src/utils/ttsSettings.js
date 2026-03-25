const STORAGE_KEY = 'ttsSettings';

export const TTS_ENGINES = {
    AUTO: 'auto',
    DEEPGRAM: 'deepgram',
    AIVIS: 'aivis',
    VOICEVOX: 'voicevox',
    BROWSER: 'browser',
};

export const DEFAULT_TTS_SETTINGS = {
    enabled: true,
    engine: TTS_ENGINES.AUTO,
    deepgramVoiceModel: 'aura-2-uzume-ja',
    aivisUrl: 'http://127.0.0.1:10101',
    voicevoxUrl: 'http://127.0.0.1:50021',
    browserPitch: 1.2,
    browserRate: 1.0,
    preferredSpeaker: '',
    battleSpeaker: '',
};

const clampNumber = (value, fallback, min, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
};

const normalizeDeepgramVoiceModel = (value) => {
    if (typeof value !== 'string') return DEFAULT_TTS_SETTINGS.deepgramVoiceModel;

    const normalized = value.trim();
    if (!normalized) return DEFAULT_TTS_SETTINGS.deepgramVoiceModel;

    // Migrate the previous English default so existing users get natural Japanese speech automatically.
    if (normalized === 'aura-2-thalia-en' || normalized === 'aura-2-izanami-ja') {
        return DEFAULT_TTS_SETTINGS.deepgramVoiceModel;
    }

    return normalized;
};

export const normalizeTtsSettings = (settings = {}) => ({
    enabled: settings.enabled !== false,
    engine: Object.values(TTS_ENGINES).includes(settings.engine) ? settings.engine : DEFAULT_TTS_SETTINGS.engine,
    deepgramVoiceModel: normalizeDeepgramVoiceModel(settings.deepgramVoiceModel),
    aivisUrl: typeof settings.aivisUrl === 'string' && settings.aivisUrl.trim()
        ? settings.aivisUrl.trim()
        : DEFAULT_TTS_SETTINGS.aivisUrl,
    voicevoxUrl: typeof settings.voicevoxUrl === 'string' && settings.voicevoxUrl.trim()
        ? settings.voicevoxUrl.trim()
        : DEFAULT_TTS_SETTINGS.voicevoxUrl,
    browserPitch: clampNumber(settings.browserPitch, DEFAULT_TTS_SETTINGS.browserPitch, 0.5, 2),
    browserRate: clampNumber(settings.browserRate, DEFAULT_TTS_SETTINGS.browserRate, 0.5, 2),
    preferredSpeaker: typeof settings.preferredSpeaker === 'string' ? settings.preferredSpeaker.trim() : '',
    battleSpeaker: typeof settings.battleSpeaker === 'string' ? settings.battleSpeaker.trim() : '',
});

export const getTtsSettings = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_TTS_SETTINGS;
        return normalizeTtsSettings(JSON.parse(raw));
    } catch {
        return DEFAULT_TTS_SETTINGS;
    }
};

export const saveTtsSettings = (settings) => {
    const normalized = normalizeTtsSettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
};
