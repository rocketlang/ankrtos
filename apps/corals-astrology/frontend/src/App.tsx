import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import KundliPage from './pages/KundliPage';
import HoroscopePage from './pages/HoroscopePage';
import TarotPage from './pages/TarotPage';
import ConsultationPage from './pages/ConsultationPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/kundli" element={<KundliPage />} />
        <Route path="/horoscope" element={<HoroscopePage />} />
        <Route path="/tarot" element={<TarotPage />} />
        <Route path="/consultation" element={<ConsultationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
