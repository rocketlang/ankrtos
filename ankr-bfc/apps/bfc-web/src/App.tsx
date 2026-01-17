/**
 * BFC Web App
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo';
import { AppLayout } from './components/Layout';
import {
  DashboardPage,
  CustomersPage,
  Customer360Page,
  CreditPage,
  CampaignsPage,
  AnalyticsPage,
  CompliancePage,
  SettingsPage,
} from './pages';

export function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<Customer360Page />} />
            <Route path="/credit" element={<CreditPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  );
}
