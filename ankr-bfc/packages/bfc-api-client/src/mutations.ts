/**
 * BFC GraphQL Mutations
 */

import { gql } from '@apollo/client';
import {
  CUSTOMER_FRAGMENT,
  CREDIT_APPLICATION_FRAGMENT,
  OFFER_FRAGMENT,
} from './queries.js';

// ============================================================================
// CUSTOMER MUTATIONS
// ============================================================================

export const CREATE_CUSTOMER = gql`
  ${CUSTOMER_FRAGMENT}
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      ...CustomerFields
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  ${CUSTOMER_FRAGMENT}
  mutation UpdateCustomer($id: ID!, $input: UpdateCustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      ...CustomerFields
    }
  }
`;

export const UPDATE_KYC_STATUS = gql`
  mutation UpdateKYCStatus($customerId: ID!, $status: KYCStatus!, $documents: [DocumentInput!]) {
    updateKYCStatus(customerId: $customerId, status: $status, documents: $documents) {
      id
      kycStatus
      kycVerifiedAt
    }
  }
`;

// ============================================================================
// CREDIT MUTATIONS
// ============================================================================

export const CREATE_CREDIT_APPLICATION = gql`
  ${CREDIT_APPLICATION_FRAGMENT}
  mutation CreateCreditApplication($input: CreateCreditApplicationInput!) {
    createCreditApplication(input: $input) {
      ...CreditApplicationFields
    }
  }
`;

export const UPDATE_APPLICATION_STATUS = gql`
  ${CREDIT_APPLICATION_FRAGMENT}
  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!, $notes: String) {
    updateApplicationStatus(id: $id, status: $status, notes: $notes) {
      ...CreditApplicationFields
    }
  }
`;

export const PROCESS_CREDIT_DECISION = gql`
  mutation ProcessCreditDecision($applicationId: ID!) {
    processCreditDecision(applicationId: $applicationId) {
      id
      decision
      riskScore
      approvedAmount
      interestRate
      tenure
      conditions
      processedAt
    }
  }
`;

export const APPROVE_APPLICATION = gql`
  ${CREDIT_APPLICATION_FRAGMENT}
  mutation ApproveApplication($id: ID!, $approvedAmount: Float!, $notes: String) {
    approveApplication(id: $id, approvedAmount: $approvedAmount, notes: $notes) {
      ...CreditApplicationFields
    }
  }
`;

export const REJECT_APPLICATION = gql`
  ${CREDIT_APPLICATION_FRAGMENT}
  mutation RejectApplication($id: ID!, $reason: String!, $notes: String) {
    rejectApplication(id: $id, reason: $reason, notes: $notes) {
      ...CreditApplicationFields
    }
  }
`;

// ============================================================================
// OFFER MUTATIONS
// ============================================================================

export const CREATE_OFFER = gql`
  ${OFFER_FRAGMENT}
  mutation CreateOffer($input: CreateOfferInput!) {
    createOffer(input: $input) {
      ...OfferFields
    }
  }
`;

export const ACCEPT_OFFER = gql`
  ${OFFER_FRAGMENT}
  mutation AcceptOffer($offerId: ID!) {
    acceptOffer(offerId: $offerId) {
      ...OfferFields
      applicationId
    }
  }
`;

export const REJECT_OFFER = gql`
  mutation RejectOffer($offerId: ID!, $reason: String) {
    rejectOffer(offerId: $offerId, reason: $reason) {
      id
      status
    }
  }
`;

export const GENERATE_OFFERS = gql`
  mutation GenerateOffers($customerId: ID!) {
    generateOffers(customerId: $customerId) {
      id
      type
      title
      amount
    }
  }
`;

// ============================================================================
// TRANSACTION MUTATIONS
// ============================================================================

export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($input: CreateTransactionInput!) {
    createTransaction(input: $input) {
      id
      type
      amount
      status
      reference
    }
  }
`;

export const INITIATE_TRANSFER = gql`
  mutation InitiateTransfer($input: TransferInput!) {
    initiateTransfer(input: $input) {
      id
      status
      reference
      amount
      fromAccount
      toAccount
    }
  }
`;

// ============================================================================
// DOCUMENT MUTATIONS
// ============================================================================

export const UPLOAD_DOCUMENT = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      id
      type
      status
      hash
      url
    }
  }
`;

export const VERIFY_DOCUMENT_MUTATION = gql`
  mutation VerifyDocumentMutation($id: ID!, $verified: Boolean!, $notes: String) {
    verifyDocumentMutation(id: $id, verified: $verified, notes: $notes) {
      id
      status
      verifiedAt
      verifiedBy
    }
  }
`;

// ============================================================================
// NOTIFICATION MUTATIONS
// ============================================================================

export const SEND_NOTIFICATION = gql`
  mutation SendNotification($input: SendNotificationInput!) {
    sendNotification(input: $input) {
      id
      type
      channel
      status
      sentAt
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      id
      readAt
    }
  }
`;

// ============================================================================
// AUTH MUTATIONS
// ============================================================================

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        email
        name
        role
        permissions
      }
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      refreshToken
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;

// ============================================================================
// CAMPAIGN MUTATIONS
// ============================================================================

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CreateCampaignInput!) {
    createCampaign(input: $input) {
      id
      name
      type
      status
      targetSegments
      startDate
      endDate
    }
  }
`;

export const LAUNCH_CAMPAIGN = gql`
  mutation LaunchCampaign($id: ID!) {
    launchCampaign(id: $id) {
      id
      status
      launchedAt
      recipientCount
    }
  }
`;
