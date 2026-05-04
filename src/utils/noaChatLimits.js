export const NOA_CHAT_LIMITS_STORAGE_KEY = 'noaChatLimits';
export const DEFAULT_NOA_CHAT_DAILY_LIMIT = 5;
export const DEFAULT_NOA_CHAT_COOLDOWN_MS = 5000;

const clampCount = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    return Math.max(0, Math.floor(numericValue));
};

const getLocalDateKey = (dateLike = Date.now()) => {
    const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDefaultStore = (dateKey = getLocalDateKey()) => ({
    dateKey,
    count: 0,
    lastAttemptAt: 0,
    noticeAcknowledged: false,
});

const normalizeStore = (rawValue, now = Date.now()) => {
    const fallback = getDefaultStore(getLocalDateKey(now));
    if (!rawValue || typeof rawValue !== 'object') {
        return fallback;
    }

    const savedDateKey = typeof rawValue.dateKey === 'string' ? rawValue.dateKey : '';
    const currentDateKey = fallback.dateKey;
    const isToday = savedDateKey === currentDateKey;

    return {
        dateKey: currentDateKey,
        count: isToday ? clampCount(rawValue.count) : 0,
        lastAttemptAt: isToday && Number.isFinite(Number(rawValue.lastAttemptAt))
            ? Math.max(0, Number(rawValue.lastAttemptAt))
            : 0,
        noticeAcknowledged: rawValue.noticeAcknowledged === true,
    };
};

const readStore = (now = Date.now()) => {
    if (typeof window === 'undefined' || !window.localStorage) {
        return getDefaultStore(getLocalDateKey(now));
    }

    try {
        const raw = window.localStorage.getItem(NOA_CHAT_LIMITS_STORAGE_KEY);
        if (!raw) return getDefaultStore(getLocalDateKey(now));

        return normalizeStore(JSON.parse(raw), now);
    } catch {
        return getDefaultStore(getLocalDateKey(now));
    }
};

const writeStore = (value, now = Date.now()) => {
    const normalized = normalizeStore(value, now);

    if (typeof window === 'undefined' || !window.localStorage) {
        return normalized;
    }

    try {
        window.localStorage.setItem(NOA_CHAT_LIMITS_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
        // Ignore quota and storage availability issues; the UI can still fall back in memory.
    }

    return normalized;
};

export const getNoaChatLimitSnapshot = (
    now = Date.now(),
    {
        dailyLimit = DEFAULT_NOA_CHAT_DAILY_LIMIT,
        cooldownMs = DEFAULT_NOA_CHAT_COOLDOWN_MS,
    } = {}
) => {
    const store = readStore(now);
    const remainingCount = Math.max(0, dailyLimit - store.count);
    const cooldownRemainingMs = Math.max(0, store.lastAttemptAt + cooldownMs - Number(now));

    return {
        ...store,
        dailyLimit,
        cooldownMs,
        remainingCount,
        isDailyLimitReached: remainingCount <= 0,
        cooldownRemainingMs,
        isCoolingDown: cooldownRemainingMs > 0,
    };
};

export const markNoaChatAttempt = (now = Date.now()) => {
    const store = readStore(now);
    return writeStore(
        {
            ...store,
            lastAttemptAt: Number(now),
        },
        now
    );
};

export const recordSuccessfulNoaChatTurn = (now = Date.now()) => {
    const store = readStore(now);
    return writeStore(
        {
            ...store,
            count: store.count + 1,
        },
        now
    );
};

export const hasAcknowledgedNoaChatNotice = (now = Date.now()) => readStore(now).noticeAcknowledged === true;

export const acknowledgeNoaChatNotice = (now = Date.now()) => {
    const store = readStore(now);
    return writeStore(
        {
            ...store,
            noticeAcknowledged: true,
        },
        now
    );
};
