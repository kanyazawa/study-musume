import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoadingScreen from '../components/UI/LoadingScreen';

const Home = lazy(() => import('../pages/Home'));
const StudySelect = lazy(() => import('../pages/StudySelect'));
const Dialogue = lazy(() => import('../pages/Dialogue'));
const CharacterInteraction = lazy(() => import('../pages/CharacterInteraction'));
const Goal = lazy(() => import('../pages/Goal'));
const Inventory = lazy(() => import('../pages/Inventory'));
const VoiceCollection = lazy(() => import('../pages/VoiceCollection'));
const Story = lazy(() => import('../pages/Story'));
const StoryReader = lazy(() => import('../pages/StoryReader'));
const RelationshipEventReader = lazy(() => import('../pages/RelationshipEventReader'));
const Stats = lazy(() => import('../pages/Stats'));
const StatsPageV0 = lazy(() => import('../pages/StatsPageV0'));
const Missions = lazy(() => import('../pages/Missions'));
const MissionsPageV0 = lazy(() => import('../pages/MissionsPageV0'));
const CalendarPage = lazy(() => import('../pages/CalendarPage'));
const Shop = lazy(() => import('../pages/Shop'));
const Gacha = lazy(() => import('../pages/Gacha'));
const Review = lazy(() => import('../pages/Review'));
const Profile = lazy(() => import('../pages/Profile'));
const Login = lazy(() => import('../pages/Login'));
const Friends = lazy(() => import('../pages/Friends'));
const Ranking = lazy(() => import('../pages/Ranking'));
const CharacterSelectPage = lazy(() => import('../pages/CharacterSelectPage'));
const MultiplayerMatch = lazy(() => import('../pages/MultiplayerMatch'));
const TitlePage = lazy(() => import('../pages/TitlePage'));
const OpeningIntro = lazy(() => import('../pages/OpeningIntro'));
const Writing = lazy(() => import('../pages/Writing'));
const Reading = lazy(() => import('../pages/Reading'));
const ExpressionPreview = lazy(() => import('../pages/ExpressionPreview'));
const CustomVocab = lazy(() => import('../pages/CustomVocab'));
const CustomVocabFlashcards = lazy(() => import('../pages/CustomVocabFlashcards'));
const ReorderPractice = lazy(() => import('../pages/ReorderPractice'));
const Tutorial = lazy(() => import('../pages/Tutorial'));

const AppRoutes = ({ stats, updateStats, onLoginSuccess, currentUser }) => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route path="/" element={<TitlePage stats={stats} />} />
      <Route
        path="/tutorial"
        element={
          stats?.tutorialCompleted
            ? <Navigate to="/home" replace />
            : <Tutorial stats={stats} updateStats={updateStats} />
        }
      />
      <Route
        path="/opening"
        element={
          !stats?.tutorialCompleted
            ? <Navigate to="/tutorial" replace />
            : stats?.needsFirstPlayIntro
            ? <OpeningIntro stats={stats} updateStats={updateStats} />
            : <Navigate to="/home" replace />
        }
      />
      <Route
        path="/home"
        element={
          !stats?.tutorialCompleted
            ? <Navigate to="/tutorial" replace />
            : stats?.needsFirstPlayIntro
            ? <Navigate to="/opening" replace />
            : <Home stats={stats} updateStats={updateStats} />
        }
      />
      <Route path="/study" element={<StudySelect stats={stats} />} />
      <Route path="/dialogue" element={<Dialogue stats={stats} updateStats={updateStats} />} />
      <Route path="/character" element={<CharacterInteraction stats={stats} updateStats={updateStats} />} />
      <Route path="/inventory" element={<Inventory stats={stats} updateStats={updateStats} />} />
      <Route path="/voice-collection" element={<VoiceCollection stats={stats} />} />
      <Route path="/story" element={<Story stats={stats} updateStats={updateStats} />} />
      <Route path="/story/:episodeId" element={<StoryReader stats={stats} updateStats={updateStats} />} />
      <Route
        path="/relationship-events/:eventId"
        element={<RelationshipEventReader stats={stats} updateStats={updateStats} />}
      />
      <Route path="/goal" element={<Goal stats={stats} updateStats={updateStats} />} />
      <Route path="/stats" element={<Stats stats={stats} />} />
      <Route path="/stats-v0" element={<StatsPageV0 />} />
      <Route path="/missions" element={<Missions stats={stats} updateStats={updateStats} />} />
      <Route path="/missions-v0" element={<MissionsPageV0 />} />
      <Route path="/calendar" element={<CalendarPage stats={stats} updateStats={updateStats} />} />
      <Route path="/shop" element={<Shop stats={stats} updateStats={updateStats} />} />
      <Route path="/gacha" element={<Gacha stats={stats} updateStats={updateStats} />} />
      <Route path="/review" element={<Review stats={stats} updateStats={updateStats} />} />
      <Route path="/writing" element={<Writing stats={stats} updateStats={updateStats} />} />
      <Route path="/reading" element={<Reading stats={stats} updateStats={updateStats} />} />
      <Route path="/expression-preview" element={<ExpressionPreview stats={stats} />} />
      <Route path="/reorder-practice" element={<ReorderPractice stats={stats} updateStats={updateStats} />} />
      <Route path="/custom-vocab" element={<CustomVocab stats={stats} />} />
      <Route path="/custom-vocab/flashcards" element={<CustomVocabFlashcards stats={stats} />} />
      <Route path="/profile" element={<Profile stats={stats} updateStats={updateStats} />} />
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/home" replace /> : <Login onLoginSuccess={onLoginSuccess} />}
      />
      <Route path="/friends" element={<Friends stats={stats} updateStats={updateStats} />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/character-select" element={<CharacterSelectPage stats={stats} updateStats={updateStats} />} />
      <Route
        path="/multiplayer-match"
        element={<MultiplayerMatch stats={stats} updateStats={updateStats} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
