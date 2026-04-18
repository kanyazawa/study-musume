const STORAGE_KEY = 'customVocabEntries';

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const normalizeEntry = (entry, index = 0) => {
    if (!entry || typeof entry !== 'object') return null;

    const word = normalizeText(entry.word);
    const meaning = normalizeText(entry.meaning);

    if (!word || !meaning) {
        return null;
    }

    return {
        id: normalizeText(entry.id) || `custom-${index}-${word.toLowerCase()}-${meaning.toLowerCase()}`,
        word,
        meaning,
        createdAt: Number.isFinite(Number(entry.createdAt)) ? Number(entry.createdAt) : Date.now(),
    };
};

export const getCustomVocabEntries = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        const normalized = parsed
            .map((entry, index) => normalizeEntry(entry, index))
            .filter(Boolean);

        if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
            saveCustomVocabEntries(normalized);
        }

        return normalized.sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0));
    } catch (error) {
        console.error('Error loading custom vocab entries:', error);
        return [];
    }
};

export const saveCustomVocabEntries = (entries) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
        console.error('Error saving custom vocab entries:', error);
    }
};

export const addCustomVocabEntry = ({ word, meaning }) => {
    const normalizedWord = normalizeText(word);
    const normalizedMeaning = normalizeText(meaning);

    if (!normalizedWord || !normalizedMeaning) {
        return { ok: false, reason: 'missing_fields' };
    }

    const entries = getCustomVocabEntries();
    const duplicateExists = entries.some((entry) => (
        entry.word.toLowerCase() === normalizedWord.toLowerCase() &&
        entry.meaning.toLowerCase() === normalizedMeaning.toLowerCase()
    ));

    if (duplicateExists) {
        return { ok: false, reason: 'duplicate' };
    }

    const newEntry = normalizeEntry({
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        word: normalizedWord,
        meaning: normalizedMeaning,
        createdAt: Date.now(),
    });
    const nextEntries = [newEntry, ...entries];
    saveCustomVocabEntries(nextEntries);

    return {
        ok: true,
        entry: newEntry,
        entries: nextEntries,
    };
};

export const removeCustomVocabEntry = (entryId) => {
    const normalizedId = normalizeText(entryId);
    const entries = getCustomVocabEntries();
    const nextEntries = entries.filter((entry) => entry.id !== normalizedId);
    saveCustomVocabEntries(nextEntries);
    return nextEntries;
};

export const getCustomVocabStudyItems = () => (
    getCustomVocabEntries().map((entry) => ({
        id: entry.id,
        word: entry.word,
        meaning: entry.meaning,
        subject: '自作単語',
    }))
);

export const getCustomVocabCount = () => getCustomVocabEntries().length;

export const CUSTOM_VOCAB_STORAGE_KEY = STORAGE_KEY;
