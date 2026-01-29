import { gql } from '@apollo/client';
import { PAGE_INFO_FIELDS } from '../fragments';

export const GET_CUSTOMS_STATS = gql`
  query GetCustomsStats($facilityId: ID!) {
    customsStats(facilityId: $facilityId) {
      totalBOE
      pendingBOE
      assessedBOE
      clearedBOE
      totalShippingBills
      pendingSB
      letExportSB
      pendingExaminations
      dutyCollected
    }
  }
`;

export const GET_BILLS_OF_ENTRY = gql`
  ${PAGE_INFO_FIELDS}
  query GetBillsOfEntry($facilityId: ID!, $status: String, $page: Int, $pageSize: Int) {
    billsOfEntry(facilityId: $facilityId, status: $status, page: $page, pageSize: $pageSize) {
      data {
        id
        boeNumber
        boeType
        importerName
        blNumber
        containerCount
        assessableValue
        totalDuty
        status
        submittedAt
        clearedAt
        createdAt
      }
      pageInfo {
        ...PageInfoFields
      }
    }
  }
`;

export const GET_SHIPPING_BILLS = gql`
  ${PAGE_INFO_FIELDS}
  query GetShippingBills($facilityId: ID!, $status: String, $page: Int, $pageSize: Int) {
    shippingBills(facilityId: $facilityId, status: $status, page: $page, pageSize: $pageSize) {
      data {
        id
        sbNumber
        sbType
        exporterName
        invoiceNumber
        fobValue
        containerCount
        status
        letExportDate
        createdAt
      }
      pageInfo {
        ...PageInfoFields
      }
    }
  }
`;
