import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import MobileContainer from './components/Layout/MobileContainer';
import AppLayout from './components/Layout/AppLayout';
import LoadingScreen from './components/UI/LoadingScreen';
import AppErrorBoundary from './components/UI/AppErrorBoundary';
import { SoundProvider } from './contexts/SoundContext';
import { clearAllLocalAppData, loadStats, saveStats } from './utils/saveUtils';
import { getAffectionLevel } from './utils/affectionUtils';
import { AFFECTION_LEVELS } from './data/affectionData';
import { useAuthSync } from './hooks/useAuthSync';
import { useNotificationInit } from './hooks/useNotificationInit';
import { useTpRecovery } from './hooks/useTpRecovery';
import AppRoutes from './routes/AppRoutes';
import './transitions.css';

// Components
import CharacterSelect from './components/CharacterSelect';

const STORY_PREVIEW_MAX_AFFECTION = AFFECTION_LEVELS[AFFECTION_LEVELS.length - 1]?.points || 15000;
const DEV_LOCAL_RESET_QUERY_KEY = 'resetLocalData';
const DEV_SKIP_CLOUD_RESTORE_SESSION_KEY = 'studyMusume:skipCloudRestoreOnce';
const DEV_RESET_BROADCAST_KEY = 'studyMusume:devResetVersion';
const DEV_NOTIFICATION_DB_NAME = 'StudyMusumeNotifications';

const consumeDevLocalReset = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return false;
  }

  const url = new URL(window.location.href);
  if (!url.searchParams.has(DEV_LOCAL_RESET_QUERY_KEY)) {
    return false;
  }

  clearAllLocalAppData();
  window.localStorage?.setItem(DEV_RESET_BROADCAST_KEY, String(Date.now()));
  window.sessionStorage?.setItem(DEV_SKIP_CLOUD_RESTORE_SESSION_KEY, '1');
  url.searchParams.delete(DEV_LOCAL_RESET_QUERY_KEY);
  window.history.replaceState({}, '', url.toString());
  return true;
};

const cleanupDevBrowserState = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch (error) {
    console.warn('Failed to unregister service workers during dev reset:', error);
  }

  try {
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase(DEV_NOTIFICATION_DB_NAME);
    }
  } catch (error) {
    console.warn('Failed to clear notification database during dev reset:', error);
  }
};

const applyStoryPreviewAffection = (stats) => {
  if (!import.meta.env.DEV || !stats) {
    return stats;
  }

  const affection = Math.max(Number(stats.affection) || 0, STORY_PREVIEW_MAX_AFFECTION);

  return {
    ...stats,
    affection,
    affectionLevel: getAffectionLevel(affection).level,
    hasSelectedCharacter: true,
  };
};

function App() {
  const didConsumeDevLocalReset = consumeDevLocalReset();
  const [stats, setStats] = useState(() => applyStoryPreviewAffection(loadStats()));
  const statsRef = useRef(stats);

  const setPreviewStats = React.useCallback((updates) => {
    setStats((currentStats) => {
      const nextStats = typeof updates === 'function' ? updates(currentStats) : updates;
      return applyStoryPreviewAffection(nextStats);
    });
  }, []);

  const { authLoading, handleLoginSuccess, currentUser } = useAuthSync(setPreviewStats);

  const handleCharacterSelectComplete = (newStats) => {
    setPreviewStats(newStats);
  };

  useNotificationInit();
  useTpRecovery(setPreviewStats);

  useEffect(() => {
    if (!didConsumeDevLocalReset) {
      return;
    }

    void cleanupDevBrowserState();
  }, [didConsumeDevLocalReset]);

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event) => {
      if (event.key !== DEV_RESET_BROADCAST_KEY || !event.newValue) {
        return;
      }

      window.sessionStorage?.setItem(DEV_SKIP_CLOUD_RESTORE_SESSION_KEY, '1');
      window.location.reload();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const updateStats = React.useCallback((updates) => {
    const currentStats = statsRef.current || {};
    const resolvedUpdates = typeof updates === 'function' ? updates(currentStats) : updates;
    const newStats = applyStoryPreviewAffection({ ...currentStats, ...(resolvedUpdates || {}) });

    statsRef.current = newStats;
    saveStats(newStats);
    setStats(newStats);
  }, []);

  if (authLoading) {
    return (
      <MobileContainer>
        <LoadingScreen />
      </MobileContainer>
    );
  }

  if (stats && !stats.hasSelectedCharacter && stats.tutorialCompleted) {
    return (
      <MobileContainer>
        <CharacterSelect onComplete={handleCharacterSelectComplete} />
      </MobileContainer>
    );
  }

  return (
    <SoundProvider>
      <Router>
        <MobileContainer>
          <AppErrorBoundary>
            <AppLayout>
              <AppRoutes
                stats={stats}
                updateStats={updateStats}
                onLoginSuccess={handleLoginSuccess}
                currentUser={currentUser}
              />
            </AppLayout>
          </AppErrorBoundary>
        </MobileContainer>
      </Router>
    </SoundProvider>
  );
}

export default App;
