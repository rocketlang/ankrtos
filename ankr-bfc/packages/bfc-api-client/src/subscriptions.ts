/**
 * BFC GraphQL Subscriptions
 */

import { gql } from '@apollo/client';

// ============================================================================
// APPLICATION SUBSCRIPTIONS
// ============================================================================

export const APPLICATION_UPDATED = gql`
  subscription ApplicationUpdated($applicationId: ID!) {
    applicationUpdated(applicationId: $applicationId) {
      id
      status
      decision
      updatedAt
      updatedBy
    }
  }
`;

export const NEW_APPLICATION = gql`
  subscription NewApplication {
    newApplication {
      id
      customerId
      type
      amount
      status
      createdAt
      customer {
        id
        name
        segment
      }
    }
  }
`;

// ============================================================================
// ALERT SUBSCRIPTIONS
// ============================================================================

export const NEW_ALERT = gql`
  subscription NewAlert {
    newAlert {
      id
      type
      severity
      title
      message
      customerId
      applicationId
      timestamp
    }
  }
`;

export const RISK_ALERT = gql`
  subscription RiskAlert($minSeverity: AlertSeverity) {
    riskAlert(minSeverity: $minSeverity) {
      id
      type
      severity
      customerId
      riskScore
      factors
      timestamp
    }
  }
`;

// ============================================================================
// CUSTOMER SUBSCRIPTIONS
// ============================================================================

export const CUSTOMER_ACTIVITY = gql`
  subscription CustomerActivity($customerId: ID!) {
    customerActivity(customerId: $customerId) {
      id
      type
      description
      amount
      timestamp
    }
  }
`;

export const CUSTOMER_STATUS_CHANGED = gql`
  subscription CustomerStatusChanged {
    customerStatusChanged {
      id
      customerId
      previousStatus
      newStatus
      reason
      timestamp
    }
  }
`;

// ============================================================================
// TRANSACTION SUBSCRIPTIONS
// ============================================================================

export const NEW_TRANSACTION = gql`
  subscription NewTransaction($customerId: ID) {
    newTransaction(customerId: $customerId) {
      id
      customerId
      type
      amount
      category
      description
      timestamp
    }
  }
`;

export const HIGH_VALUE_TRANSACTION = gql`
  subscription HighValueTransaction($threshold: Float!) {
    highValueTransaction(threshold: $threshold) {
      id
      customerId
      amount
      type
      riskFlags
      timestamp
      customer {
        id
        name
        segment
      }
    }
  }
`;

// ============================================================================
// NOTIFICATION SUBSCRIPTIONS
// ============================================================================

export const USER_NOTIFICATION = gql`
  subscription UserNotification($userId: ID!) {
    userNotification(userId: $userId) {
      id
      type
      title
      message
      priority
      actionUrl
      timestamp
    }
  }
`;

// ============================================================================
// CAMPAIGN SUBSCRIPTIONS
// ============================================================================

export const CAMPAIGN_PROGRESS = gql`
  subscription CampaignProgress($campaignId: ID!) {
    campaignProgress(campaignId: $campaignId) {
      campaignId
      sent
      delivered
      opened
      clicked
      converted
      timestamp
    }
  }
`;

// ============================================================================
// DOCUMENT SUBSCRIPTIONS
// ============================================================================

export const DOCUMENT_VERIFIED = gql`
  subscription DocumentVerified($customerId: ID) {
    documentVerified(customerId: $customerId) {
      id
      customerId
      type
      status
      verifiedAt
      verifiedBy
    }
  }
`;

// ============================================================================
// SYSTEM SUBSCRIPTIONS
// ============================================================================

export const SYSTEM_HEALTH = gql`
  subscription SystemHealth {
    systemHealth {
      service
      status
      latency
      errorRate
      timestamp
    }
  }
`;
