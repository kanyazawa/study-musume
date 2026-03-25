import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoadingScreen from '../components/UI/LoadingScreen';

const Home = lazy(() => import('../pages/Home'));
const StudySelect = lazy(() => import('../pages/StudySelect'));
const Dialogue = lazy(() => import('../pages/Dialogue'));
const CharacterInteraction = lazy(() => import('../pages/CharacterInteraction'));
const Goal = lazy(() => import('../pages/Goal'));
const Inventory = lazy(() => import('../pages/Inventory'));
const Story = lazy(() => import('../pages/Story'));
const StoryReader = lazy(() => import('../pages/StoryReader'));
const Stats = lazy(() => import('../pages/Stats'));
const StatsPageV0 = lazy(() => import('../pages/StatsPageV0'));
const Missions = lazy(() => import('../pages/Missions'));
const CalendarPage = lazy(() => import('../pages/CalendarPage'));
const Gacha = lazy(() => import('../pages/Gacha'));
const Review = lazy(() => import('../pages/Review'));
const Profile = lazy(() => import('../pages/Profile'));
const Login = lazy(() => import('../pages/Login'));
const Friends = lazy(() => import('../pages/Friends'));
const Ranking = lazy(() => import('../pages/Ranking'));
const CharacterSelectPage = lazy(() => import('../pages/CharacterSelectPage'));
const MultiplayerMatch = lazy(() => import('../pages/MultiplayerMatch'));
const TitlePage = lazy(() => import('../pages/TitlePage'));

const AppRoutes = ({ stats, updateStats, onLoginSuccess, currentUser }) => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route path="/" element={<TitlePage />} />
      <Route path="/home" element={<Home stats={stats} updateStats={updateStats} />} />
      <Route path="/study" element={<StudySelect stats={stats} />} />
      <Route path="/dialogue" element={<Dialogue stats={stats} updateStats={updateStats} />} />
      <Route path="/character" element={<CharacterInteraction stats={stats} updateStats={updateStats} />} />
      <Route path="/inventory" element={<Inventory stats={stats} updateStats={updateStats} />} />
      <Route path="/story" element={<Story stats={stats} />} />
      <Route path="/story/:episodeId" element={<StoryReader stats={stats} />} />
      <Route path="/goal" element={<Goal stats={stats} updateStats={updateStats} />} />
      <Route path="/stats" element={<Stats stats={stats} />} />
      <Route path="/stats-v0" element={<StatsPageV0 />} />
      <Route path="/missions" element={<Missions stats={stats} updateStats={updateStats} />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/gacha" element={<Gacha stats={stats} updateStats={updateStats} />} />
      <Route path="/review" element={<Review stats={stats} />} />
      <Route path="/profile" element={<Profile stats={stats} updateStats={updateStats} />} />
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/home" replace /> : <Login onLoginSuccess={onLoginSuccess} />}
      />
      <Route path="/friends" element={<Friends stats={stats} />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/character-select" element={<CharacterSelectPage updateStats={updateStats} />} />
      <Route
        path="/multiplayer-match"
        element={<MultiplayerMatch stats={stats} updateStats={updateStats} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
