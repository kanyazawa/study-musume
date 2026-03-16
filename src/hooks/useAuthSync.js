import { useEffect, useState } from 'react';
import { subscribeToAuthState, handleRedirectResult } from '../firebase/auth';
import { auth } from '../firebase/config';
import { syncOnLogin, uploadAllSaveData } from '../firebase/sync';
import { loadStats, registerCloudSync } from '../utils/saveUtils';

export const useAuthSync = (setStats) => {
  const [, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const redirectToHomeIfNeeded = () => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === '/login') {
      window.location.replace('/home');
    }
  };

  useEffect(() => {
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

    const unsubscribe = subscribeToAuthState(async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        console.log('User signed in, syncing data...');
        const syncResult = await syncOnLogin(user.uid);
        if (syncResult.success && syncResult.source === 'cloud') {
          setStats(loadStats());
          console.log('Restored data from cloud');
        }

        redirectToHomeIfNeeded();

        registerCloudSync(async () => {
          if (auth.currentUser) {
            await uploadAllSaveData(auth.currentUser.uid);
          }
        });
        return;
      }

      registerCloudSync(null);
    });

    return () => {
      registerCloudSync(null);
      unsubscribe();
    };
  }, [setStats]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  return { authLoading, handleLoginSuccess };
};
