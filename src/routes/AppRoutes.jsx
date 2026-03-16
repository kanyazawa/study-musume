import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';
import StudySelect from '../pages/StudySelect';
import Dialogue from '../pages/Dialogue';
import CharacterInteraction from '../pages/CharacterInteraction';
import Goal from '../pages/Goal';
import Inventory from '../pages/Inventory';
import Story from '../pages/Story';
import StoryReader from '../pages/StoryReader';
import Stats from '../pages/Stats';
import StatsPageV0 from '../pages/StatsPageV0';
import Missions from '../pages/Missions';
import CalendarPage from '../pages/CalendarPage';
import Gacha from '../pages/Gacha';
import Review from '../pages/Review';
import Profile from '../pages/Profile';
import Login from '../pages/Login';
import Friends from '../pages/Friends';
import Ranking from '../pages/Ranking';
import CharacterSelectPage from '../pages/CharacterSelectPage';
import MultiplayerMatch from '../pages/MultiplayerMatch';
import TitlePage from '../pages/TitlePage';

const AppRoutes = ({ stats, updateStats, onLoginSuccess, currentUser }) => (
  <Routes>
    <Route path="/" element={<TitlePage />} />
    <Route path="/home" element={<Home stats={stats} updateStats={updateStats} />} />
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
    <Route
      path="/login"
      element={currentUser ? <Navigate to="/home" replace /> : <Login onLoginSuccess={onLoginSuccess} />}
    />
    <Route path="/friends" element={<Friends />} />
    <Route path="/ranking" element={<Ranking />} />
    <Route path="/character-select" element={<CharacterSelectPage updateStats={updateStats} />} />
    <Route
      path="/multiplayer-match"
      element={<MultiplayerMatch stats={stats} updateStats={updateStats} />}
    />
  </Routes>
);

export default AppRoutes;
