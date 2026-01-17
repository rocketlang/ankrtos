/**
 * BFC Apollo Provider
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ApolloProvider, ApolloClient, type NormalizedCacheObject } from '@apollo/client';
import { createBFCClient, type BFCClientConfig } from './client.js';

interface BFCContextValue {
  client: ApolloClient<NormalizedCacheObject>;
}

const BFCContext = createContext<BFCContextValue | null>(null);

export interface BFCProviderProps extends Partial<BFCClientConfig> {
  children: ReactNode;
  client?: ApolloClient<NormalizedCacheObject>;
}

/**
 * BFC Apollo Provider
 *
 * Wraps the app with Apollo Client configured for BFC API
 */
export function BFCProvider({
  children,
  client: providedClient,
  ...config
}: BFCProviderProps) {
  const client = useMemo(() => {
    return providedClient || createBFCClient(config);
  }, [providedClient, config.apiUrl, config.wsUrl]);

  const value = useMemo(() => ({ client }), [client]);

  return (
    <BFCContext.Provider value={value}>
      <ApolloProvider client={client}>
        {children}
      </ApolloProvider>
    </BFCContext.Provider>
  );
}

/**
 * Hook to access BFC Apollo client
 */
export function useBFCClient() {
  const context = useContext(BFCContext);
  if (!context) {
    throw new Error('useBFCClient must be used within a BFCProvider');
  }
  return context.client;
}
