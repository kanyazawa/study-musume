const normalizeVoicePath = (value) => String(value || '').trim();

const replaceEmmaWithNoah = (value) => value
    .replace(/(^|\/)emma(?=\/)/, '$1noah')
    .replace(/(^|\/)emma-/, '$1noah-');

export const toLocalAudioPath = (filename, { defaultExtension = '.mp3' } = {}) => {
    const normalized = normalizeVoicePath(filename);
    if (!normalized) return '';

    if (normalized.startsWith('/')) {
        return normalized;
    }

    if (normalized.startsWith('audio/')) {
        return `/${normalized}`;
    }

    if (normalized.includes('.')) {
        return `/audio/${normalized}`;
    }

    return `/audio/${normalized}${defaultExtension}`;
};

export const getVoiceFallbackCandidates = (filename) => {
    const normalized = normalizeVoicePath(filename);
    if (!normalized) {
        return [];
    }

    const candidates = [normalized];
    const noahFallback = replaceEmmaWithNoah(normalized);

    if (noahFallback !== normalized) {
        candidates.push(noahFallback);
    }

    return candidates;
};
