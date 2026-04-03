const WRITING_HISTORY_KEY = 'writingHistory';
const WRITING_DRAFTS_KEY = 'writingDrafts';
const MAX_HISTORY_ITEMS = 20;

const safeParse = (value, fallback) => {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

export const countEnglishWords = (text) => {
    const matches = String(text || '').match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
    return matches ? matches.length : 0;
};

export const getWritingHistory = () => {
    if (typeof localStorage === 'undefined') {
        return [];
    }

    const parsed = safeParse(localStorage.getItem(WRITING_HISTORY_KEY) || '[]', []);
    if (!Array.isArray(parsed)) {
        return [];
    }

    return parsed
        .filter((entry) => entry && typeof entry === 'object')
        .sort((a, b) => (b.evaluatedAt || 0) - (a.evaluatedAt || 0));
};

export const saveWritingResult = (result) => {
    if (typeof localStorage === 'undefined') {
        return [];
    }

    const nextHistory = [result, ...getWritingHistory()]
        .filter(Boolean)
        .slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(WRITING_HISTORY_KEY, JSON.stringify(nextHistory));
    return nextHistory;
};

export const getWritingDraft = (promptId) => {
    if (typeof localStorage === 'undefined' || !promptId) {
        return '';
    }

    const drafts = safeParse(localStorage.getItem(WRITING_DRAFTS_KEY) || '{}', {});
    return typeof drafts?.[promptId] === 'string' ? drafts[promptId] : '';
};

export const saveWritingDraft = (promptId, draft) => {
    if (typeof localStorage === 'undefined' || !promptId) {
        return;
    }

    const drafts = safeParse(localStorage.getItem(WRITING_DRAFTS_KEY) || '{}', {});
    drafts[promptId] = String(draft || '');
    localStorage.setItem(WRITING_DRAFTS_KEY, JSON.stringify(drafts));
};

export const clearWritingDraft = (promptId) => {
    if (typeof localStorage === 'undefined' || !promptId) {
        return;
    }

    const drafts = safeParse(localStorage.getItem(WRITING_DRAFTS_KEY) || '{}', {});
    delete drafts[promptId];
    localStorage.setItem(WRITING_DRAFTS_KEY, JSON.stringify(drafts));
};

export const getWritingSummary = (history = getWritingHistory()) => {
    if (!Array.isArray(history) || history.length === 0) {
        return {
            attempts: 0,
            averageScore: 0,
            bestScore: 0,
        };
    }

    const scores = history
        .map((entry) => Number(entry?.evaluation?.overallScore || 0))
        .filter((score) => Number.isFinite(score));

    const total = scores.reduce((sum, score) => sum + score, 0);

    return {
        attempts: history.length,
        averageScore: scores.length ? Math.round((total / scores.length) * 10) / 10 : 0,
        bestScore: scores.length ? Math.max(...scores) : 0,
    };
};
