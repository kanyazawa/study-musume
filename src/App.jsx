import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import MobileContainer from './components/Layout/MobileContainer';
import AppLayout from './components/Layout/AppLayout';
import CloudSyncNotice from './components/CloudSyncNotice';
import LoadingScreen from './components/UI/LoadingScreen';
import AppErrorBoundary from './components/UI/AppErrorBoundary';
import { SoundProvider } from './contexts/SoundContext';
import { loadStats, saveStats } from './utils/saveUtils';
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
  const [stats, setStats] = useState(() => applyStoryPreviewAffection(loadStats()));
  const statsRef = useRef(stats);

  const setPreviewStats = React.useCallback((updates) => {
    setStats((currentStats) => {
      const nextStats = typeof updates === 'function' ? updates(currentStats) : updates;
      return applyStoryPreviewAffection(nextStats);
    });
  }, []);

  const { authLoading, handleLoginSuccess, currentUser, syncNotice } = useAuthSync(setPreviewStats);

  const handleCharacterSelectComplete = (newStats) => {
    setPreviewStats(newStats);
  };

  useNotificationInit();
  useTpRecovery(setPreviewStats);

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
          <CloudSyncNotice notice={syncNotice} />
        </MobileContainer>
      </Router>
    </SoundProvider>
  );
}

export default App;
