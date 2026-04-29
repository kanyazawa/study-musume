import {
    collection,
    doc,
    getDocs,
    increment,
    query,
    runTransaction,
    serverTimestamp,
    where,
} from 'firebase/firestore';
import { db } from './config';
import {
    REFERRAL_REWARD,
    normalizeReferralCode,
} from '../utils/referralUtils';

const REFERRAL_CLAIMS_COLLECTION = 'referralClaims';

const getUsersCollection = () => collection(db, 'users');

const getReferralClaimRef = (inviteeUid) => doc(db, REFERRAL_CLAIMS_COLLECTION, inviteeUid);

export const redeemReferralCode = async ({ inviteeUid, inviteeDisplayName = '', inviterCode }) => {
    if (!db) {
        return { success: false, error: 'Firebase が未設定のため、招待コードは使えません。' };
    }

    const normalizedCode = normalizeReferralCode(inviterCode);
    if (!inviteeUid || !normalizedCode) {
        return { success: false, error: '招待コードを確認してください。' };
    }

    const inviterQuery = query(getUsersCollection(), where('friendCode', '==', normalizedCode));
    const inviterSnapshot = await getDocs(inviterQuery);

    if (inviterSnapshot.empty) {
        return { success: false, error: 'その招待コードは見つかりませんでした。' };
    }

    const inviterDoc = inviterSnapshot.docs[0];
    const inviterUid = inviterDoc.id;

    if (inviterUid === inviteeUid) {
        return { success: false, error: '自分の招待コードは使えません。' };
    }

    const inviteeRef = doc(db, 'users', inviteeUid);
    const inviterRef = doc(db, 'users', inviterUid);
    const claimRef = getReferralClaimRef(inviteeUid);

    try {
        await runTransaction(db, async (transaction) => {
            const inviteeSnap = await transaction.get(inviteeRef);
            const inviterSnap = await transaction.get(inviterRef);
            const claimSnap = await transaction.get(claimRef);

            if (!inviteeSnap.exists()) {
                throw new Error('招待特典の受け取りにはログインが必要です。');
            }

            if (!inviterSnap.exists()) {
                throw new Error('招待したユーザーが見つかりませんでした。');
            }

            if (claimSnap.exists()) {
                throw new Error('招待コードの特典はすでに受け取り済みです。');
            }

            const inviteeData = inviteeSnap.data() || {};
            if (inviteeData.referredByUid || inviteeData.referredByCode) {
                throw new Error('招待コードの入力は1回だけです。');
            }

            transaction.set(claimRef, {
                inviterUid,
                inviterCode: normalizedCode,
                inviteeUid,
                inviteeDisplayName,
                reward: REFERRAL_REWARD,
                createdAt: serverTimestamp(),
            });

            transaction.update(inviteeRef, {
                referredByUid: inviterUid,
                referredByCode: normalizedCode,
                referralClaimedAt: serverTimestamp(),
            });

            transaction.update(inviterRef, {
                referralInviteCount: increment(1),
                referralPendingClaims: increment(1),
                referralPendingDiamonds: increment(REFERRAL_REWARD.diamonds),
                referralPendingIntellect: increment(REFERRAL_REWARD.intellect),
                referralTotalDiamonds: increment(REFERRAL_REWARD.diamonds),
                referralTotalIntellect: increment(REFERRAL_REWARD.intellect),
                lastReferralAt: serverTimestamp(),
            });
        });

        return {
            success: true,
            inviter: {
                uid: inviterUid,
                displayName: inviterDoc.data()?.displayName || 'トレーナー',
                friendCode: normalizedCode,
            },
            reward: { ...REFERRAL_REWARD },
        };
    } catch (error) {
        return { success: false, error: error.message || '招待コードの処理に失敗しました。' };
    }
};

export const claimPendingReferralRewards = async (uid) => {
    if (!db || !uid) {
        return { success: false, reward: null };
    }

    const userRef = doc(db, 'users', uid);

    try {
        const reward = await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                return null;
            }

            const data = userSnap.data() || {};
            const diamonds = Math.max(0, Number(data.referralPendingDiamonds) || 0);
            const intellect = Math.max(0, Number(data.referralPendingIntellect) || 0);
            const claims = Math.max(0, Number(data.referralPendingClaims) || 0);

            if (diamonds <= 0 && intellect <= 0 && claims <= 0) {
                return null;
            }

            transaction.update(userRef, {
                referralPendingDiamonds: 0,
                referralPendingIntellect: 0,
                referralPendingClaims: 0,
                lastReferralCollectedAt: serverTimestamp(),
            });

            return {
                diamonds,
                intellect,
                claims,
            };
        });

        return {
            success: true,
            reward,
        };
    } catch (error) {
        console.error('Claim pending referral rewards error:', error);
        return {
            success: false,
            error: error.message || '招待報酬の受け取りに失敗しました。',
            reward: null,
        };
    }
};
