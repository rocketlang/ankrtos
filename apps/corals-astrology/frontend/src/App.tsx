import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Main Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChoosePlanPage from './pages/ChoosePlanPage';
import DashboardPage from './pages/DashboardPage';

// Service Pages
import BookPanditPage from './pages/BookPanditPage';
import TempleStorePage from './pages/TempleStorePage';
import AskAcharyaPage from './pages/AskAcharyaPage';
import KundliMatchingPage from './pages/KundliMatchingPage';
import SanskritiPage from './pages/SanskritiPage';
import ScriptureReaderPage from './pages/ScriptureReaderPage';
import MythologyPage from './pages/MythologyPage';
import StoryReaderPage from './pages/StoryReaderPage';

// Legacy Pages (keeping for backward compatibility)
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import SystemsPage from './pages/SystemsPage';
import KundliPage from './pages/KundliPage';
import HoroscopePage from './pages/HoroscopePage';
import TarotPage from './pages/TarotPage';
import ConsultationPage from './pages/ConsultationPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* New Main Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/choose-plan" element={<ChoosePlanPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Service Pages */}
        <Route path="/book-pandit" element={<BookPanditPage />} />
        <Route path="/store" element={<TempleStorePage />} />
        <Route path="/ask-acharya" element={<AskAcharyaPage />} />
        <Route path="/kundli-matching" element={<KundliMatchingPage />} />
        <Route path="/sanskriti" element={<SanskritiPage />} />
        <Route path="/scripture/:scriptureId/:chapterNum" element={<ScriptureReaderPage />} />
        <Route path="/mythology" element={<MythologyPage />} />
        <Route path="/story/:storyId" element={<StoryReaderPage />} />

        {/* Legacy Routes - keeping for backward compatibility */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/systems" element={<SystemsPage />} />
        <Route path="/kundli" element={<KundliPage />} />
        <Route path="/horoscope" element={<HoroscopePage />} />
        <Route path="/tarot" element={<TarotPage />} />
        <Route path="/consultation" element={<ConsultationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
