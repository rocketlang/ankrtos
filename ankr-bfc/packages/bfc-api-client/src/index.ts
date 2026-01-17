/**
 * @ankr-bfc/api-client
 *
 * GraphQL API client with React hooks for BFC Platform
 *
 * @example
 * ```tsx
 * import { BFCProvider, useCustomers, useDashboardStats } from '@ankr-bfc/api-client';
 *
 * function App() {
 *   return (
 *     <BFCProvider apiUrl="http://localhost:4020/graphql">
 *       <Dashboard />
 *     </BFCProvider>
 *   );
 * }
 *
 * function Dashboard() {
 *   const { data, loading } = useDashboardStats();
 *   const { data: customers } = useCustomers();
 *   // ...
 * }
 * ```
 */

// Client
export { createBFCClient, getBFCClient, type BFCClientConfig } from './client.js';

// Provider
export { BFCProvider, useBFCClient } from './provider.js';

// Queries
export * from './queries.js';

// Mutations
export * from './mutations.js';

// Subscriptions
export * from './subscriptions.js';

// Hooks
export * from './hooks.js';

// Re-export useful Apollo types
export {
  useQuery,
  useMutation,
  useLazyQuery,
  useSubscription,
  type ApolloError,
  type QueryResult,
  type MutationResult,
} from '@apollo/client';
