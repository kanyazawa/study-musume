import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import MobileContainer from './components/Layout/MobileContainer';
import AppLayout from './components/Layout/AppLayout';
import LoadingScreen from './components/UI/LoadingScreen';
import { SoundProvider } from './contexts/SoundContext';
import { loadStats, saveStats } from './utils/saveUtils';
import { useAuthSync } from './hooks/useAuthSync';
import { useNotificationInit } from './hooks/useNotificationInit';
import { useTpRecovery } from './hooks/useTpRecovery';
import AppRoutes from './routes/AppRoutes';
import './transitions.css';

// Components
import CharacterSelect from './components/CharacterSelect';

function App() {
  const [stats, setStats] = useState(() => loadStats());
  const { authLoading, handleLoginSuccess, currentUser } = useAuthSync(setStats);

  const handleCharacterSelectComplete = (newStats) => {
    setStats(newStats);
  };

  useNotificationInit();
  useTpRecovery(setStats);

  const updateStats = React.useCallback((updates) => {
    setStats((prev) => {
      const newStats = { ...prev, ...updates };
      saveStats(newStats);
      return newStats;
    });
  }, []);

  if (authLoading) {
    return (
      <MobileContainer>
        <LoadingScreen />
      </MobileContainer>
    );
  }

  if (stats && !stats.hasSelectedCharacter) {
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
          <AppLayout>
            <AppRoutes
              stats={stats}
              updateStats={updateStats}
              onLoginSuccess={handleLoginSuccess}
              currentUser={currentUser}
            />
          </AppLayout>
        </MobileContainer>
      </Router>
    </SoundProvider>
  );
}

export default App;
