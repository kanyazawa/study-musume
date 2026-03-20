const STORAGE_KEY = 'noaChatHistory';
const MAX_MESSAGES_PER_TOPIC = 6;

const normalizeMessage = (message) => {
    if (!message || typeof message.content !== 'string') return null;

    const role = message.role === 'user' ? 'user' : 'assistant';
    const content = message.content.trim();
    if (!content) return null;

    return { role, content };
};

const readStore = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const writeStore = (store) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const getNoaChatMessages = (topicKey, fallbackMessages = []) => {
    const key = String(topicKey || 'default');
    const store = readStore();
    const savedMessages = Array.isArray(store[key])
        ? store[key].map(normalizeMessage).filter(Boolean)
        : [];

    if (savedMessages.length > 0) {
        return savedMessages;
    }

    return fallbackMessages.map(normalizeMessage).filter(Boolean);
};

export const saveNoaChatMessages = (topicKey, messages) => {
    const key = String(topicKey || 'default');
    const normalized = Array.isArray(messages)
        ? messages.map(normalizeMessage).filter(Boolean).slice(-MAX_MESSAGES_PER_TOPIC)
        : [];

    const store = readStore();
    store[key] = normalized;
    writeStore(store);

    return normalized;
};

export const clearNoaChatMessages = (topicKey) => {
    const key = String(topicKey || 'default');
    const store = readStore();
    delete store[key];
    writeStore(store);
};

export const getLatestNoaAssistantMessage = (topicKey, fallbackMessages = []) => {
    const messages = getNoaChatMessages(topicKey, fallbackMessages);

    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index];
        if (message?.role === 'assistant' && message?.content) {
            return message.content;
        }
    }

    return '';
};
