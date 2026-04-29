import { describe, expect, it } from 'vitest';
import {
    REFERRAL_REWARD,
    applyRewardToStats,
    buildReferralInviteMessage,
    getReferralSummary,
    normalizeReferralCode,
} from './referralUtils';

describe('referralUtils', () => {
    it('normalizes referral codes to supported characters', () => {
        expect(normalizeReferralCode(' ab-1o9z! ')).toBe('ABO9Z');
        expect(normalizeReferralCode('abcdefgh')).toBe('ABCDEF');
    });

    it('adds rewards onto stats safely', () => {
        expect(applyRewardToStats({ diamonds: 10, intellect: 5 }, { diamonds: 3, intellect: 9 })).toEqual({
            diamonds: 13,
            intellect: 14,
        });
    });

    it('builds an invite message with the configured reward', () => {
        const message = buildReferralInviteMessage({ displayName: 'ノア', code: 'ab23cd' });

        expect(message).toContain('AB23CD');
        expect(message).toContain(String(REFERRAL_REWARD.diamonds));
        expect(message).toContain(String(REFERRAL_REWARD.intellect));
    });

    it('returns a normalized summary object', () => {
        expect(getReferralSummary({
            referralInviteCount: '2',
            referralPendingClaims: 1,
            referralPendingDiamonds: '200',
            referredByCode: 'ab23cd',
        })).toEqual({
            inviteCount: 2,
            pendingClaims: 1,
            pendingDiamonds: 200,
            pendingIntellect: 0,
            referredByCode: 'AB23CD',
        });
    });
});
