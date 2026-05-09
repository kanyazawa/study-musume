const VALID_WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const VALID_SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const VALID_TERMS = ['opening', 'midterm', 'holiday', 'final'];
const VALID_TIME_SLOTS = ['morning', 'day', 'afterSchool', 'night'];
const VALID_ROUTE_STATUSES = ['common', 'pending', 'locked', 'ending', 'completed'];
const VALID_PROMISE_STATUSES = ['scheduled', 'available', 'completed', 'missed', 'cancelled'];

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeString = (value, fallback = '') => (
    typeof value === 'string' ? value : fallback
);

const normalizeNullableString = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const normalizeTimestamp = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return Number.isFinite(Number(value)) ? Number(value) : null;
};

const normalizeEnum = (value, validValues, fallback) => (
    validValues.includes(value) ? value : fallback
);

export const getDefaultCalendarState = () => ({
    day: 1,
    weekday: 'mon',
    month: 4,
    season: 'spring',
    term: 'opening',
    timeSlot: 'morning',
    loopCount: 1,
    lastAdvancedAt: null,
});

export const normalizeCalendarState = (calendarState = {}) => {
    const source = calendarState && typeof calendarState === 'object' ? calendarState : {};

    return {
        day: clampNumber(Math.floor(Number(source.day) || 1), 1, 366),
        weekday: normalizeEnum(source.weekday, VALID_WEEKDAYS, 'mon'),
        month: clampNumber(Math.floor(Number(source.month) || 4), 1, 12),
        season: normalizeEnum(source.season, VALID_SEASONS, 'spring'),
        term: normalizeEnum(source.term, VALID_TERMS, 'opening'),
        timeSlot: normalizeEnum(source.timeSlot, VALID_TIME_SLOTS, 'morning'),
        loopCount: Math.max(1, Math.floor(Number(source.loopCount) || 1)),
        lastAdvancedAt: normalizeTimestamp(source.lastAdvancedAt),
    };
};

export const getDefaultRouteState = () => ({
    status: 'common',
    characterId: null,
    pendingCharacterId: null,
    lockSourceEventId: '',
    endingId: '',
    lastUpdatedAt: null,
});

export const normalizeRouteState = (routeState = {}) => {
    const source = routeState && typeof routeState === 'object' ? routeState : {};
    const status = normalizeEnum(source.status, VALID_ROUTE_STATUSES, 'common');
    const characterId = normalizeNullableString(source.characterId);
    const pendingCharacterId = normalizeNullableString(source.pendingCharacterId);
    const normalizedCharacterId = status === 'common' && !pendingCharacterId ? null : characterId;

    return {
        status,
        characterId: normalizedCharacterId,
        pendingCharacterId,
        lockSourceEventId: normalizeString(source.lockSourceEventId, ''),
        endingId: normalizeString(source.endingId, ''),
        lastUpdatedAt: normalizeTimestamp(source.lastUpdatedAt),
    };
};

const normalizePromiseEntry = (entry = {}) => {
    const source = entry && typeof entry === 'object' ? entry : {};
    const createdAt = normalizeTimestamp(source.createdAt);

    return {
        id: normalizeString(source.id, ''),
        title: normalizeString(source.title, ''),
        characterId: normalizeNullableString(source.characterId),
        dateKey: normalizeString(source.dateKey, ''),
        timeSlot: normalizeEnum(source.timeSlot, VALID_TIME_SLOTS, 'afterSchool'),
        locationId: normalizeString(source.locationId, ''),
        eventId: normalizeString(source.eventId, ''),
        status: normalizeEnum(source.status, VALID_PROMISE_STATUSES, 'scheduled'),
        createdAt,
        resolvedAt: normalizeTimestamp(source.resolvedAt),
    };
};

export const getDefaultPromiseState = () => ({
    activePromises: [],
    completedPromiseIds: [],
    brokenPromiseIds: [],
    lastResolvedAt: null,
});

export const normalizePromiseState = (promiseState = {}) => {
    const source = promiseState && typeof promiseState === 'object' ? promiseState : {};
    const activePromises = Array.isArray(source.activePromises)
        ? source.activePromises
            .map((entry) => normalizePromiseEntry(entry))
            .filter((entry) => entry.id)
        : [];

    const toUniqueIdList = (entries) => (
        Array.isArray(entries)
            ? [...new Set(entries.filter((entry) => typeof entry === 'string' && entry.trim().length > 0))]
            : []
    );

    return {
        activePromises,
        completedPromiseIds: toUniqueIdList(source.completedPromiseIds),
        brokenPromiseIds: toUniqueIdList(source.brokenPromiseIds),
        lastResolvedAt: normalizeTimestamp(source.lastResolvedAt),
    };
};

export const normalizeStoryProgressionStats = (stats = {}) => ({
    ...stats,
    calendarState: normalizeCalendarState(stats?.calendarState),
    routeState: normalizeRouteState(stats?.routeState),
    promiseState: normalizePromiseState(stats?.promiseState),
});
