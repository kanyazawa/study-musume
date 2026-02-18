import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MobileContainer from './components/Layout/MobileContainer';
import Footer from './components/Layout/Footer';
import LoadingScreen from './components/UI/LoadingScreen';
import VolumeControl from './components/UI/VolumeControl'; // 追加
import { SoundProvider } from './contexts/SoundContext'; // 追加 // 追加
import { loadStats, saveStats, registerCloudSync } from './utils/saveUtils';
import { subscribeToAuthState, handleRedirectResult } from './firebase/auth';
import { auth } from './firebase/config';
import { syncOnLogin, uploadAllSaveData } from './firebase/sync';
import { updateTpWithRecovery } from './utils/tpRecoveryUtils';
import { initNotificationSystem } from './utils/notificationUtils';
import './transitions.css';

// Pages
// Pages
import TitlePage from './pages/TitlePage'; // 追加
import Home from './pages/Home';
import StudySelect from './pages/StudySelect';
import Dialogue from './pages/Dialogue';
import CharacterInteraction from './pages/CharacterInteraction';
import Goal from './pages/Goal';

import Inventory from './pages/Inventory';
import Story from './pages/Story';
import StoryReader from './pages/StoryReader';
import Stats from './pages/Stats';
import StatsPageV0 from './pages/StatsPageV0';
import Missions from './pages/Missions';
import CalendarPage from './pages/CalendarPage';
import Gacha from './pages/Gacha';
import Review from './pages/Review';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Friends from './pages/Friends';
import Ranking from './pages/Ranking';
import CharacterSelectPage from './pages/CharacterSelectPage';


// Function to control Footer visibility based on current path
const Layout = ({ children }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = React.useState(location);

  React.useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setDisplayLocation(location);
    }
  }, [location, displayLocation]);

  // Footerを非表示にするパスのリスト
  // Footerを非表示にするパスのリスト
  const hideFooterPaths = ['/study', '/dialogue', '/character-select'];
  // タイトル画面(/)もフッター非表示
  const isTitlePage = location.pathname === '/';
  const shouldHideFooter = isTitlePage || hideFooterPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      <div
        className="content-container fadeIn"
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
        key={location.pathname}
      >
        {children}
      </div>
      {!shouldHideFooter && <Footer />}
    </>
  );
};

// Components
import CharacterSelect from './components/CharacterSelect'; // 追加

function App() {
  // localStorageから統計情報を読み込み（初回起動時はデフォルト値）
  const [stats, setStats] = useState(() => loadStats());
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Character Select Handler
  const handleCharacterSelectComplete = (newStats) => {
    setStats(newStats);
  };

  // Firebase認証状態を監視
  useEffect(() => {
    // ... existing auth logic ...
    // リダイレクトログインの結果を処理
    handleRedirectResult().then((result) => {
      if (result.success && result.user) {
        console.log("Redirect login successful:", result.user.displayName);
      }
    }).catch((err) => {
      console.error("Redirect result check failed:", err);
    });

    const unsubscribe = subscribeToAuthState(async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // ログイン時: 全データ同期
        console.log('User signed in, syncing data...');
        const syncResult = await syncOnLogin(user.uid);
        if (syncResult.success && syncResult.source === 'cloud') {
          // クラウドデータで復元された場合、画面の統計情報を更新
          setStats(loadStats());
          console.log('Restored data from cloud');
        }

        // 自動同期コールバックを登録（saveStats時に呼ばれる）
        registerCloudSync(async () => {
          if (auth.currentUser) {
            await uploadAllSaveData(auth.currentUser.uid);
          }
        });
      } else {
        // ログアウト時: 同期停止
        registerCloudSync(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 通知システム初期化
  useEffect(() => {
    initNotificationSystem();
  }, []);

  // TP自動回復システム
  useEffect(() => {
    // 初回起動時にTP回復チェック
    const recoveryUpdate = updateTpWithRecovery(stats);
    if (recoveryUpdate) {
      updateStats(recoveryUpdate);
    }

    // 1分ごとにTP回復チェック
    const interval = setInterval(() => {
      setStats(currentStats => {
        const recovery = updateTpWithRecovery(currentStats);
        if (recovery) {
          const newStats = { ...currentStats, ...recovery };
          saveStats(newStats);
          return newStats;
        }
        return currentStats;
      });
    }, 60 * 1000); // 1分ごと

    return () => clearInterval(interval);
  }, []);

  // 統計情報を更新し、localStorageに保存
  const updateStats = React.useCallback((updates) => {
    setStats(prev => {
      const newStats = { ...prev, ...updates };
      saveStats(newStats); // localStorageに自動保存
      return newStats;
    });
  }, []);

  // ログイン成功時のコールバック
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  // 認証チェック中はローディング画面を表示
  if (authLoading) {
    return (
      <MobileContainer>
        <LoadingScreen />
      </MobileContainer>
    );
  }

  // キャラクター選択がまだの場合（初回ユーザ）
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
          <Layout>
            <Routes>
              <Route path="/" element={<TitlePage />} /> {/* タイトル画面 */}
              <Route path="/home" element={<Home stats={stats} updateStats={updateStats} />} /> {/* ホーム画面 */}
              <Route path="/study" element={<StudySelect stats={stats} />} />
              <Route path="/dialogue" element={<Dialogue stats={stats} updateStats={updateStats} />} />
              <Route path="/character" element={<CharacterInteraction stats={stats} updateStats={updateStats} />} />

              <Route path="/inventory" element={<Inventory stats={stats} updateStats={updateStats} />} />
              <Route path="/story" element={<Story stats={stats} />} />
              <Route path="/story/:episodeId" element={<StoryReader stats={stats} />} />
              <Route path="/goal" element={<Goal />} />
              <Route path="/stats" element={<Stats stats={stats} />} />
              <Route path="/stats-v0" element={<StatsPageV0 />} />
              <Route path="/missions" element={<Missions stats={stats} updateStats={updateStats} />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/gacha" element={<Gacha stats={stats} updateStats={updateStats} />} />
              <Route path="/review" element={<Review />} />
              <Route path="/profile" element={<Profile stats={stats} updateStats={updateStats} />} />
              <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/character-select" element={<CharacterSelectPage updateStats={updateStats} />} />

            </Routes>
          </Layout>
          {/* VolumeControl removed (moved to Settings) */}
        </MobileContainer>
      </Router>
    </SoundProvider >
  );
}

export default App;
