/**
 * Customer App GraphQL Queries
 */

import { gql } from '@apollo/client';

export const GET_CUSTOMER_PROFILE = gql`
  query GetCustomerProfile {
    me {
      id
      customerId
      name
      email
      phone
      segment
      kycStatus
      accounts {
        id
        type
        number
        balance
        currency
      }
    }
  }
`;

export const GET_ACCOUNTS = gql`
  query GetAccounts {
    myAccounts {
      id
      type
      number
      balance
      currency
      status
    }
  }
`;

export const GET_TRANSACTIONS = gql`
  query GetTransactions($accountId: ID, $limit: Int, $offset: Int) {
    myTransactions(accountId: $accountId, limit: $limit, offset: $offset) {
      items {
        id
        type
        amount
        category
        description
        reference
        status
        createdAt
      }
      total
      hasMore
    }
  }
`;

export const GET_OFFERS = gql`
  query GetMyOffers {
    myOffers {
      id
      type
      title
      description
      amount
      interestRate
      tenure
      status
      expiresAt
    }
  }
`;

export const GET_OFFER_DETAILS = gql`
  query GetOfferDetails($id: ID!) {
    offer(id: $id) {
      id
      type
      title
      description
      amount
      interestRate
      tenure
      emi
      processingFee
      terms
      status
      expiresAt
    }
  }
`;

export const ACCEPT_OFFER = gql`
  mutation AcceptOffer($offerId: ID!) {
    acceptOffer(offerId: $offerId) {
      id
      status
      applicationId
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
    }
  }
`;

export const LOGIN = gql`
  mutation CustomerLogin($phone: String!, $otp: String!) {
    customerLogin(phone: $phone, otp: $otp) {
      token
      refreshToken
      customer {
        id
        name
        email
        phone
      }
    }
  }
`;

export const REQUEST_OTP = gql`
  mutation RequestOTP($phone: String!) {
    requestOTP(phone: $phone) {
      success
      message
    }
  }
`;
