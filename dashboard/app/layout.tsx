import type { Metadata } from 'next';
import './globals.css';

import { ApolloWrapper } from '@/lib/apollo-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { FacilityProvider } from '@/contexts/facility-context';
import { DashboardShell } from '@/components/layout/shell';

export const metadata: Metadata = {
  title: 'ankrICD - Terminal Operations Dashboard',
  description: 'ICD & CFS Management System - Operations Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          <AuthProvider>
            <FacilityProvider>
              <DashboardShell>
                {children}
              </DashboardShell>
            </FacilityProvider>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
