import { useEffect, useState } from 'react';
import { subscribeToAuthState, handleRedirectResult, ensureUserDocument } from '../firebase/auth';
import { auth } from '../firebase/config';
import { syncOnLogin, uploadAllSaveData, subscribeToCloudSave } from '../firebase/sync';
import { claimPendingReferralRewards } from '../firebase/referrals';
import { applyRewardToStats } from '../utils/referralUtils';
import { loadStats, registerCloudSync, restoreAllSaveData, saveStats } from '../utils/saveUtils';
import { isNativeIOSApp } from '../native/nativeGoogleAuth';

export const useAuthSync = (setStats) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const redirectToHomeIfNeeded = () => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === '/login') {
      window.location.replace('/home');
    }
  };

  useEffect(() => {
    let saveDataUnsubscribe = null;

    if (!isNativeIOSApp()) {
      handleRedirectResult()
        .then((result) => {
          if (result.success && result.user) {
            console.log('Redirect login successful:', result.user.displayName);
            redirectToHomeIfNeeded();
          }
        })
        .catch((err) => {
          console.error('Redirect result check failed:', err);
        });
    }

    const unsubscribe = subscribeToAuthState(async (user) => {
      if (saveDataUnsubscribe) {
        saveDataUnsubscribe();
        saveDataUnsubscribe = null;
      }

      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        console.log('User signed in, syncing data...');
        await ensureUserDocument(user);
        const syncResult = await syncOnLogin(user.uid);
        if (syncResult.success && syncResult.source === 'cloud') {
          setStats(loadStats());
          console.log('Restored data from cloud');
        }

        const pendingReferralResult = await claimPendingReferralRewards(user.uid);
        if (pendingReferralResult.success && pendingReferralResult.reward) {
          const nextStats = applyRewardToStats(loadStats(), pendingReferralResult.reward);
          saveStats(nextStats);
          setStats(nextStats);
        }

        redirectToHomeIfNeeded();

        registerCloudSync(async () => {
          if (auth.currentUser) {
            await uploadAllSaveData(auth.currentUser.uid);
          }
        });

        saveDataUnsubscribe = subscribeToCloudSave(user.uid, ({ data, savedAt }) => {
          const localSavedAt = Number(localStorage.getItem('__saveDataUpdatedAt') || 0);
          if (!savedAt || savedAt <= localSavedAt) {
            return;
          }

          console.log('[CloudSync] 新しいクラウドデータを検出したため反映します');
          restoreAllSaveData(data);
          setStats(loadStats());
        });
        return;
      }

      registerCloudSync(null);
    });

    return () => {
      if (saveDataUnsubscribe) {
        saveDataUnsubscribe();
      }
      registerCloudSync(null);
      unsubscribe();
    };
  }, [setStats]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  return { authLoading, handleLoginSuccess, currentUser };
};
