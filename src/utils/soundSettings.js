const STORAGE_KEY = 'soundSettings';

export const DEFAULT_SOUND_SETTINGS = {
    isMuted: false,
    bgmVolume: 0.3,
    seVolume: 0.35,
    voiceVolume: 0.5,
};

const clampVolume = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.min(1, Math.max(0, parsed));
};

export const normalizeSoundSettings = (settings = {}) => ({
    isMuted: settings.isMuted === true,
    bgmVolume: clampVolume(settings.bgmVolume ?? settings.volume, DEFAULT_SOUND_SETTINGS.bgmVolume),
    seVolume: clampVolume(settings.seVolume, DEFAULT_SOUND_SETTINGS.seVolume),
    voiceVolume: clampVolume(settings.voiceVolume, DEFAULT_SOUND_SETTINGS.voiceVolume),
});

export const loadSoundSettings = () => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        return DEFAULT_SOUND_SETTINGS;
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return DEFAULT_SOUND_SETTINGS;
        }

        return normalizeSoundSettings(JSON.parse(raw));
    } catch {
        return DEFAULT_SOUND_SETTINGS;
    }
};

export const saveSoundSettings = (settings) => {
    const normalized = normalizeSoundSettings(settings);

    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
};
