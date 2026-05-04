import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    acknowledgeNoaChatNotice,
    DEFAULT_NOA_CHAT_COOLDOWN_MS,
    DEFAULT_NOA_CHAT_DAILY_LIMIT,
    getNoaChatLimitSnapshot,
    hasAcknowledgedNoaChatNotice,
    markNoaChatAttempt,
    NOA_CHAT_LIMITS_STORAGE_KEY,
    recordSuccessfulNoaChatTurn,
} from './noaChatLimits';

describe('noaChatLimits', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('tracks successful chat turns against the daily limit', () => {
        const now = new Date('2026-05-04T10:00:00+09:00').getTime();

        recordSuccessfulNoaChatTurn(now);
        recordSuccessfulNoaChatTurn(now + 1000);

        expect(getNoaChatLimitSnapshot(now + 1000)).toMatchObject({
            count: 2,
            remainingCount: DEFAULT_NOA_CHAT_DAILY_LIMIT - 2,
            isDailyLimitReached: false,
        });
    });

    it('resets the daily count when the date changes', () => {
        const today = new Date('2026-05-04T23:58:00+09:00').getTime();
        const nextDay = new Date('2026-05-05T08:00:00+09:00').getTime();

        recordSuccessfulNoaChatTurn(today);

        expect(getNoaChatLimitSnapshot(nextDay)).toMatchObject({
            count: 0,
            remainingCount: DEFAULT_NOA_CHAT_DAILY_LIMIT,
            isDailyLimitReached: false,
        });
    });

    it('reports the remaining cooldown after an attempt', () => {
        const now = new Date('2026-05-04T12:00:00+09:00').getTime();
        markNoaChatAttempt(now);

        const snapshot = getNoaChatLimitSnapshot(now + 1200);
        expect(snapshot.isCoolingDown).toBe(true);
        expect(snapshot.cooldownRemainingMs).toBe(DEFAULT_NOA_CHAT_COOLDOWN_MS - 1200);
    });

    it('persists notice acknowledgement separately from the daily counter', () => {
        const now = new Date('2026-05-04T09:30:00+09:00').getTime();
        const nextDay = new Date('2026-05-05T09:30:00+09:00').getTime();

        acknowledgeNoaChatNotice(now);
        recordSuccessfulNoaChatTurn(now);

        expect(hasAcknowledgedNoaChatNotice(now)).toBe(true);
        expect(getNoaChatLimitSnapshot(nextDay).count).toBe(0);
        expect(hasAcknowledgedNoaChatNotice(nextDay)).toBe(true);
    });

    it('falls back safely when localStorage contains invalid data', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce('{broken json');

        const snapshot = getNoaChatLimitSnapshot();
        expect(snapshot.count).toBe(0);
        expect(snapshot.remainingCount).toBe(DEFAULT_NOA_CHAT_DAILY_LIMIT);
    });

    it('stores data under the dedicated chat limits key', () => {
        const now = new Date('2026-05-04T11:00:00+09:00').getTime();
        recordSuccessfulNoaChatTurn(now);

        expect(JSON.parse(localStorage.getItem(NOA_CHAT_LIMITS_STORAGE_KEY))).toMatchObject({
            dateKey: '2026-05-04',
            count: 1,
        });
    });
});
