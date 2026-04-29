export const REFERRAL_REWARD = Object.freeze({
    diamonds: 200,
    intellect: 100,
});

export const REFERRAL_CODE_LENGTH = 6;

export const normalizeReferralCode = (value = '') => value
    .toUpperCase()
    .replace(/[^A-Z2-9]/g, '')
    .slice(0, REFERRAL_CODE_LENGTH);

export const applyRewardToStats = (stats = {}, reward = {}) => ({
    ...stats,
    diamonds: (Number(stats.diamonds) || 0) + Math.max(0, Number(reward.diamonds) || 0),
    intellect: (Number(stats.intellect) || 0) + Math.max(0, Number(reward.intellect) || 0),
});

export const buildReferralInviteMessage = ({ displayName = 'トレーナー', code = '' } = {}) => {
    const normalizedCode = normalizeReferralCode(code);
    if (!normalizedCode) {
        return 'Study Musume で一緒に勉強しよう！';
    }

    return `${displayName}さんから Study Musume の招待です。招待コード「${normalizedCode}」を入力すると、お互いに 💎${REFERRAL_REWARD.diamonds} と 🧠${REFERRAL_REWARD.intellect} を受け取れます。`;
};

export const getReferralSummary = (profile = {}) => ({
    inviteCount: Math.max(0, Number(profile.referralInviteCount) || 0),
    pendingClaims: Math.max(0, Number(profile.referralPendingClaims) || 0),
    pendingDiamonds: Math.max(0, Number(profile.referralPendingDiamonds) || 0),
    pendingIntellect: Math.max(0, Number(profile.referralPendingIntellect) || 0),
    referredByCode: typeof profile.referredByCode === 'string' ? normalizeReferralCode(profile.referredByCode) : '',
});
