/**
 * GraphQL Queries and Mutations
 */

import { gql } from '@apollo/client';

// ============================================================================
// CUSTOMER QUERIES
// ============================================================================

export const GET_CUSTOMER = gql`
  query GetCustomer($id: ID!) {
    customer(id: $id) {
      id
      externalId
      firstName
      lastName
      email
      phone
      pan
      segment
      kycStatus
      riskScore
      trustScore
      ltv
      createdAt
      updatedAt
    }
  }
`;

export const GET_CUSTOMER_360 = gql`
  query GetCustomer360($customerId: ID!) {
    customer360(customerId: $customerId) {
      customer {
        id
        firstName
        lastName
        email
        phone
        segment
        kycStatus
        riskScore
        trustScore
      }
      metrics {
        totalEpisodes
        successRate
        recentActivity
        ltv
        tenure
        productCount
      }
      episodes {
        id
        state
        action
        outcome
        success
        module
        createdAt
      }
      products {
        id
        productType
        status
        openedAt
      }
      activeOffers {
        id
        offerType
        title
        confidence
        status
      }
    }
  }
`;

export const SEARCH_CUSTOMERS = gql`
  query SearchCustomers($query: CustomerSearchInput!, $limit: Int) {
    searchCustomers(query: $query, limit: $limit) {
      id
      firstName
      lastName
      email
      phone
      segment
      riskScore
      kycStatus
    }
  }
`;

// ============================================================================
// EPISODE MUTATIONS
// ============================================================================

export const RECORD_EPISODE = gql`
  mutation RecordEpisode($input: EpisodeInput!) {
    recordEpisode(input: $input) {
      id
      state
      action
      outcome
      success
      module
    }
  }
`;

// ============================================================================
// CREDIT QUERIES/MUTATIONS
// ============================================================================

export const REQUEST_CREDIT_DECISION = gql`
  mutation RequestCreditDecision($input: CreditApplicationInput!) {
    requestCreditDecision(input: $input) {
      applicationId
      recommendation
      confidence
      reasoning
      suggestedTerms {
        amount
        tenure
        interestRate
        emi
      }
      riskFactors
      positiveFactors
    }
  }
`;

// ============================================================================
// OFFER QUERIES
// ============================================================================

export const GET_CUSTOMER_OFFERS = gql`
  query GetCustomerOffers($customerId: ID!) {
    customerOffers(customerId: $customerId) {
      id
      offerType
      title
      description
      confidence
      status
      expiresAt
    }
  }
`;

export const GET_OFFER_RECOMMENDATIONS = gql`
  query GetOfferRecommendations($customerId: ID!) {
    offerRecommendations(customerId: $customerId) {
      offerType
      title
      description
      confidence
      reasoning
    }
  }
`;

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalCustomers
      activeCustomers
      newCustomersToday
      pendingKyc
      highRiskCustomers
      totalApplications
      approvedApplications
      pendingApplications
      conversionRate
    }
  }
`;

export const GET_SEGMENT_ANALYTICS = gql`
  query GetSegmentAnalytics($segment: String!) {
    segmentAnalytics(segment: $segment) {
      segment
      customerCount
      averageRiskScore
      averageTrustScore
      averageLtv
      topProducts
    }
  }
`;
