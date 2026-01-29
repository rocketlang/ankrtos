import { gql } from '@apollo/client';
import { PAGE_INFO_FIELDS } from '../fragments';

export const GET_BILLING_STATS = gql`
  query GetBillingStats($facilityId: ID!) {
    billingStats(facilityId: $facilityId) {
      totalRevenue
      totalOutstanding
      pendingInvoices
      overdueInvoices
      collectionRate
      averagePaymentDays
    }
  }
`;

export const GET_INVOICES = gql`
  ${PAGE_INFO_FIELDS}
  query GetInvoices($facilityId: ID!, $customerId: ID, $status: String, $page: Int, $pageSize: Int) {
    invoices(facilityId: $facilityId, customerId: $customerId, status: $status, page: $page, pageSize: $pageSize) {
      data {
        id
        invoiceNumber
        customerId
        customerName
        invoiceType
        invoiceDate
        dueDate
        totalAmount
        paidAmount
        balance
        status
        currency
        createdAt
      }
      pageInfo {
        ...PageInfoFields
      }
    }
  }
`;

export const GET_CUSTOMERS = gql`
  ${PAGE_INFO_FIELDS}
  query GetCustomers($facilityId: ID!, $type: String, $status: String, $page: Int, $pageSize: Int) {
    customers(facilityId: $facilityId, type: $type, status: $status, page: $page, pageSize: $pageSize) {
      data {
        id
        customerCode
        name
        type
        status
        creditLimit
        outstandingAmount
        creditStatus
        paymentTerms
        containersHandled
        createdAt
      }
      pageInfo {
        ...PageInfoFields
      }
    }
  }
`;
