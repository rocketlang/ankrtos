/**
 * Mari8X Portal Application
 * Multi-role portal for Owners, Charterers, Brokers, and Agents
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OwnerPortal } from './pages/OwnerPortal';
import { ChartererPortal } from './pages/ChartererPortal';
import { BrokerPortal } from './pages/BrokerPortal';
import { AgentPortal } from './pages/AgentPortal';
import { LoginPage } from './pages/LoginPage';
import { useAuthStore } from './hooks/useAuthStore';

export function App() {
  const { user, role } = useAuthStore();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/owner/*" element={<OwnerPortal />} />
      <Route path="/charterer/*" element={<ChartererPortal />} />
      <Route path="/broker/*" element={<BrokerPortal />} />
      <Route path="/agent/*" element={<AgentPortal />} />
      <Route
        path="/"
        element={
          <Navigate
            to={
              role === 'owner'
                ? '/owner'
                : role === 'charterer'
                ? '/charterer'
                : role === 'broker'
                ? '/broker'
                : '/agent'
            }
            replace
          />
        }
      />
    </Routes>
  );
}
