import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Vessels } from './pages/Vessels';
import { Ports } from './pages/Ports';
import { Companies } from './pages/Companies';
import { Chartering } from './pages/Chartering';
import { Voyages } from './pages/Voyages';
import { PortMap } from './pages/PortMap';
import { Features } from './pages/Features';
import { useAuthStore } from './lib/stores/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/vessels" element={<Vessels />} />
        <Route path="/ports" element={<Ports />} />
        <Route path="/port-map" element={<PortMap />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/chartering" element={<Chartering />} />
        <Route path="/voyages" element={<Voyages />} />
        <Route path="/features" element={<Features />} />
      </Route>
    </Routes>
  );
}
