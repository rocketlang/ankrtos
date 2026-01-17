/**
 * BFC GraphQL Queries
 */

import { gql } from '@apollo/client';

// ============================================================================
// FRAGMENTS
// ============================================================================

export const CUSTOMER_FRAGMENT = gql`
  fragment CustomerFields on Customer {
    id
    customerId
    name
    email
    phone
    segment
    riskScore
    ltv
    kycStatus
    createdAt
    updatedAt
  }
`;

export const CREDIT_APPLICATION_FRAGMENT = gql`
  fragment CreditApplicationFields on CreditApplication {
    id
    customerId
    type
    amount
    status
    riskScore
    decision
    createdAt
    updatedAt
  }
`;

export const OFFER_FRAGMENT = gql`
  fragment OfferFields on Offer {
    id
    customerId
    type
    title
    description
    amount
    interestRate
    tenure
    status
    expiresAt
    createdAt
  }
`;

export const TRANSACTION_FRAGMENT = gql`
  fragment TransactionFields on Transaction {
    id
    customerId
    type
    amount
    category
    description
    reference
    status
    createdAt
  }
`;

// ============================================================================
// CUSTOMER QUERIES
// ============================================================================

export const GET_CUSTOMERS = gql`
  ${CUSTOMER_FRAGMENT}
  query GetCustomers($filter: CustomerFilter, $limit: Int, $offset: Int) {
    customers(filter: $filter, limit: $limit, offset: $offset) {
      items {
        ...CustomerFields
      }
      total
      hasMore
    }
  }
`;

export const GET_CUSTOMER = gql`
  ${CUSTOMER_FRAGMENT}
  ${TRANSACTION_FRAGMENT}
  query GetCustomer($id: ID!) {
    customer(id: $id) {
      ...CustomerFields
      accounts {
        id
        type
        number
        balance
        currency
      }
      recentTransactions {
        ...TransactionFields
      }
      activeOffers {
        id
        type
        title
        amount
        status
      }
    }
  }
`;

export const SEARCH_CUSTOMERS = gql`
  ${CUSTOMER_FRAGMENT}
  query SearchCustomers($query: String!, $limit: Int) {
    searchCustomers(query: $query, limit: $limit) {
      ...CustomerFields
    }
  }
`;

// ============================================================================
// CREDIT QUERIES
// ============================================================================

export const GET_CREDIT_APPLICATIONS = gql`
  ${CREDIT_APPLICATION_FRAGMENT}
  query GetCreditApplications($filter: CreditApplicationFilter, $limit: Int, $offset: Int) {
    creditApplications(filter: $filter, limit: $limit, offset: $offset) {
      items {
        ...CreditApplicationFields
        customer {
          id
          name
          segment
        }
      }
      total
      hasMore
    }
  }
`;

export const GET_CREDIT_APPLICATION = gql`
  ${CREDIT_APPLICATION_FRAGMENT}
  query GetCreditApplication($id: ID!) {
    creditApplication(id: $id) {
      ...CreditApplicationFields
      customer {
        id
        name
        email
        phone
        segment
        riskScore
      }
      documents {
        id
        type
        status
        url
      }
      timeline {
        id
        action
        actor
        timestamp
        notes
      }
    }
  }
`;

// ============================================================================
// OFFER QUERIES
// ============================================================================

export const GET_OFFERS = gql`
  ${OFFER_FRAGMENT}
  query GetOffers($customerId: ID, $status: OfferStatus, $limit: Int) {
    offers(customerId: $customerId, status: $status, limit: $limit) {
      ...OfferFields
      customer {
        id
        name
      }
    }
  }
`;

export const GET_CUSTOMER_OFFERS = gql`
  ${OFFER_FRAGMENT}
  query GetCustomerOffers($customerId: ID!) {
    customerOffers(customerId: $customerId) {
      ...OfferFields
    }
  }
`;

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($dateRange: DateRange) {
    dashboardStats(dateRange: $dateRange) {
      totalCustomers
      customerGrowth
      activeApplications
      applicationGrowth
      approvalRate
      approvalChange
      highRiskAlerts
      alertChange
    }
  }
`;

export const GET_APPLICATION_TRENDS = gql`
  query GetApplicationTrends($period: TrendPeriod!) {
    applicationTrends(period: $period) {
      date
      applications
      approvals
      rejections
    }
  }
`;

export const GET_SEGMENT_DISTRIBUTION = gql`
  query GetSegmentDistribution {
    segmentDistribution {
      segment
      count
      percentage
    }
  }
`;

export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($limit: Int) {
    recentActivity(limit: $limit) {
      id
      type
      customer {
        id
        name
      }
      description
      amount
      timestamp
    }
  }
`;

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

export const GET_TRANSACTIONS = gql`
  ${TRANSACTION_FRAGMENT}
  query GetTransactions($customerId: ID!, $filter: TransactionFilter, $limit: Int, $offset: Int) {
    transactions(customerId: $customerId, filter: $filter, limit: $limit, offset: $offset) {
      items {
        ...TransactionFields
      }
      total
      hasMore
    }
  }
`;

// ============================================================================
// DOCUMENT QUERIES
// ============================================================================

export const GET_DOCUMENTS = gql`
  query GetDocuments($filter: DocumentFilter, $limit: Int, $offset: Int) {
    documents(filter: $filter, limit: $limit, offset: $offset) {
      items {
        id
        type
        status
        customerId
        hash
        createdAt
        verifiedAt
      }
      total
    }
  }
`;

export const VERIFY_DOCUMENT = gql`
  query VerifyDocument($id: ID!) {
    verifyDocument(id: $id) {
      valid
      hash
      chain {
        blockNumber
        action
        timestamp
        actor
      }
    }
  }
`;
