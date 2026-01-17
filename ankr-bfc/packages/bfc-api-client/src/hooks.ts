/**
 * BFC React Hooks for GraphQL
 */

import { useQuery, useMutation, useSubscription, type QueryHookOptions } from '@apollo/client';
import * as queries from './queries.js';
import * as mutations from './mutations.js';
import * as subscriptions from './subscriptions.js';

// ============================================================================
// CUSTOMER HOOKS
// ============================================================================

export function useCustomers(options?: QueryHookOptions) {
  return useQuery(queries.GET_CUSTOMERS, options);
}

export function useCustomer(id: string, options?: QueryHookOptions) {
  return useQuery(queries.GET_CUSTOMER, {
    variables: { id },
    skip: !id,
    ...options,
  });
}

export function useSearchCustomers(query: string, options?: QueryHookOptions) {
  return useQuery(queries.SEARCH_CUSTOMERS, {
    variables: { query, limit: 10 },
    skip: !query || query.length < 2,
    ...options,
  });
}

export function useCreateCustomer() {
  return useMutation(mutations.CREATE_CUSTOMER, {
    refetchQueries: [{ query: queries.GET_CUSTOMERS }],
  });
}

export function useUpdateCustomer() {
  return useMutation(mutations.UPDATE_CUSTOMER);
}

export function useUpdateKYCStatus() {
  return useMutation(mutations.UPDATE_KYC_STATUS);
}

// ============================================================================
// CREDIT HOOKS
// ============================================================================

export function useCreditApplications(options?: QueryHookOptions) {
  return useQuery(queries.GET_CREDIT_APPLICATIONS, options);
}

export function useCreditApplication(id: string, options?: QueryHookOptions) {
  return useQuery(queries.GET_CREDIT_APPLICATION, {
    variables: { id },
    skip: !id,
    ...options,
  });
}

export function useCreateCreditApplication() {
  return useMutation(mutations.CREATE_CREDIT_APPLICATION, {
    refetchQueries: [{ query: queries.GET_CREDIT_APPLICATIONS }],
  });
}

export function useProcessCreditDecision() {
  return useMutation(mutations.PROCESS_CREDIT_DECISION);
}

export function useApproveApplication() {
  return useMutation(mutations.APPROVE_APPLICATION);
}

export function useRejectApplication() {
  return useMutation(mutations.REJECT_APPLICATION);
}

// ============================================================================
// OFFER HOOKS
// ============================================================================

export function useOffers(options?: QueryHookOptions) {
  return useQuery(queries.GET_OFFERS, options);
}

export function useCustomerOffers(customerId: string, options?: QueryHookOptions) {
  return useQuery(queries.GET_CUSTOMER_OFFERS, {
    variables: { customerId },
    skip: !customerId,
    ...options,
  });
}

export function useAcceptOffer() {
  return useMutation(mutations.ACCEPT_OFFER);
}

export function useRejectOffer() {
  return useMutation(mutations.REJECT_OFFER);
}

export function useGenerateOffers() {
  return useMutation(mutations.GENERATE_OFFERS);
}

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

export function useDashboardStats(options?: QueryHookOptions) {
  return useQuery(queries.GET_DASHBOARD_STATS, {
    pollInterval: 60000, // Refresh every minute
    ...options,
  });
}

export function useApplicationTrends(period: 'week' | 'month' | 'quarter' = 'month') {
  return useQuery(queries.GET_APPLICATION_TRENDS, {
    variables: { period },
  });
}

export function useSegmentDistribution() {
  return useQuery(queries.GET_SEGMENT_DISTRIBUTION);
}

export function useRecentActivity(limit = 10) {
  return useQuery(queries.GET_RECENT_ACTIVITY, {
    variables: { limit },
    pollInterval: 30000,
  });
}

// ============================================================================
// TRANSACTION HOOKS
// ============================================================================

export function useTransactions(customerId: string, options?: QueryHookOptions) {
  return useQuery(queries.GET_TRANSACTIONS, {
    variables: { customerId },
    skip: !customerId,
    ...options,
  });
}

export function useCreateTransaction() {
  return useMutation(mutations.CREATE_TRANSACTION);
}

export function useInitiateTransfer() {
  return useMutation(mutations.INITIATE_TRANSFER);
}

// ============================================================================
// DOCUMENT HOOKS
// ============================================================================

export function useDocuments(options?: QueryHookOptions) {
  return useQuery(queries.GET_DOCUMENTS, options);
}

export function useVerifyDocument(id: string) {
  return useQuery(queries.VERIFY_DOCUMENT, {
    variables: { id },
    skip: !id,
  });
}

export function useUploadDocument() {
  return useMutation(mutations.UPLOAD_DOCUMENT);
}

// ============================================================================
// AUTH HOOKS
// ============================================================================

export function useLogin() {
  return useMutation(mutations.LOGIN);
}

export function useLogout() {
  return useMutation(mutations.LOGOUT);
}

export function useRefreshToken() {
  return useMutation(mutations.REFRESH_TOKEN);
}

// ============================================================================
// NOTIFICATION HOOKS
// ============================================================================

export function useSendNotification() {
  return useMutation(mutations.SEND_NOTIFICATION);
}

export function useMarkNotificationRead() {
  return useMutation(mutations.MARK_NOTIFICATION_READ);
}

// ============================================================================
// SUBSCRIPTION HOOKS
// ============================================================================

export function useApplicationUpdates(applicationId: string) {
  return useSubscription(subscriptions.APPLICATION_UPDATED, {
    variables: { applicationId },
    skip: !applicationId,
  });
}

export function useNewAlerts() {
  return useSubscription(subscriptions.NEW_ALERT);
}

export function useCustomerActivity(customerId: string) {
  return useSubscription(subscriptions.CUSTOMER_ACTIVITY, {
    variables: { customerId },
    skip: !customerId,
  });
}

// ============================================================================
// CAMPAIGN HOOKS
// ============================================================================

export function useCreateCampaign() {
  return useMutation(mutations.CREATE_CAMPAIGN);
}

export function useLaunchCampaign() {
  return useMutation(mutations.LAUNCH_CAMPAIGN);
}
