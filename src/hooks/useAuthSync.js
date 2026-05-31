import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeToAuthState, handleRedirectResult, ensureUserDocument } from '../firebase/auth';
import { auth } from '../firebase/config';
import { syncOnLogin, uploadAllSaveData, subscribeToCloudSave } from '../firebase/sync';
import { claimPendingReferralRewards } from '../firebase/referrals';
import { applyRewardToStats } from '../utils/referralUtils';
import { loadStats, registerCloudSync, restoreAllSaveData, saveStats } from '../utils/saveUtils';
import { isNativeIOSApp } from '../native/nativeGoogleAuth';

const HIDDEN_SYNC_NOTICE = {
  visible: false,
  status: 'idle',
  message: '',
};

export const useAuthSync = (setStats) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncNotice, setSyncNotice] = useState(HIDDEN_SYNC_NOTICE);
  const hideNoticeTimeoutRef = useRef(null);

  const clearSyncNoticeTimer = useCallback(() => {
    if (hideNoticeTimeoutRef.current) {
      window.clearTimeout(hideNoticeTimeoutRef.current);
      hideNoticeTimeoutRef.current = null;
    }
  }, []);

  const showSyncNotice = useCallback((status, message, { autoHideMs = 2600 } = {}) => {
    clearSyncNoticeTimer();
    setSyncNotice({
      visible: true,
      status,
      message,
    });

    if (autoHideMs > 0) {
      hideNoticeTimeoutRef.current = window.setTimeout(() => {
        setSyncNotice(HIDDEN_SYNC_NOTICE);
        hideNoticeTimeoutRef.current = null;
      }, autoHideMs);
    }
  }, [clearSyncNoticeTimer]);

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
        showSyncNotice('syncing', 'クラウド同期中...', { autoHideMs: 0 });
        await ensureUserDocument(user);
        const syncResult = await syncOnLogin(user.uid);
        if (syncResult.success) {
          if (syncResult.source === 'cloud') {
            setStats(loadStats());
            console.log('Restored data from cloud');
            showSyncNotice('success', 'クラウドのデータを読み込みました');
          } else {
            showSyncNotice('success', 'この端末のデータを同期しました');
          }
        } else {
          showSyncNotice('error', 'クラウド同期に失敗しました', { autoHideMs: 4000 });
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
            showSyncNotice('syncing', 'クラウドに保存中...', { autoHideMs: 0 });
            const uploadResult = await uploadAllSaveData(auth.currentUser.uid);
            if (uploadResult.success) {
              showSyncNotice('success', 'クラウドに保存しました');
            } else {
              showSyncNotice('error', 'クラウド保存に失敗しました', { autoHideMs: 4000 });
            }
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
          showSyncNotice('success', '別端末の変更を反映しました');
        });
        return;
      }

      clearSyncNoticeTimer();
      setSyncNotice(HIDDEN_SYNC_NOTICE);
      registerCloudSync(null);
    });

    return () => {
      if (saveDataUnsubscribe) {
        saveDataUnsubscribe();
      }
      clearSyncNoticeTimer();
      registerCloudSync(null);
      unsubscribe();
    };
  }, [clearSyncNoticeTimer, setStats, showSyncNotice]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  return { authLoading, handleLoginSuccess, currentUser, syncNotice };
};
