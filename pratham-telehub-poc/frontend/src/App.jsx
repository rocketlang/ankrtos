import React, { useState, useEffect } from 'react';
import TelecallerDashboard from './pages/TelecallerDashboard';
import ManagerCommandCenter from './pages/ManagerCommandCenter';

const API_BASE = 'http://localhost:3100';

export default function App() {
  const [view, setView] = useState('telecaller'); // 'telecaller' or 'manager'
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Simulate login - in production this would be real auth
    setUser({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Priya Sharma',
      role: 'telecaller',
      email: 'priya.sharma@pratham.org'
    });
  }, []);

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <span>🚀</span>
          <span>TeleHub</span>
        </div>

        <div className="nav-menu">
          <div
            className={`nav-item ${view === 'telecaller' ? 'active' : ''}`}
            onClick={() => setView('telecaller')}
          >
            <span>📞</span>
            <span>My Dashboard</span>
          </div>

          <div
            className={`nav-item ${view === 'manager' ? 'active' : ''}`}
            onClick={() => setView('manager')}
          >
            <span>📊</span>
            <span>Command Center</span>
          </div>

          <div className="nav-item">
            <span>📈</span>
            <span>Analytics</span>
          </div>

          <div className="nav-item">
            <span>👥</span>
            <span>Team</span>
          </div>

          <div className="nav-item">
            <span>⚙️</span>
            <span>Settings</span>
          </div>
        </div>

        <div style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Logged in as</div>
          <div style={{ fontWeight: 600, marginTop: '4px' }}>{user?.name}</div>
          <div style={{ fontSize: '0.85em', opacity: 0.7, marginTop: '2px' }}>
            {user?.role}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {view === 'telecaller' && <TelecallerDashboard user={user} apiBase={API_BASE} />}
        {view === 'manager' && <ManagerCommandCenter apiBase={API_BASE} />}
      </div>
    </div>
  );
}
