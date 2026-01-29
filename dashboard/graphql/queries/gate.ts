import { gql } from '@apollo/client';
import { GATE_TRANSACTION_FIELDS, PAGE_INFO_FIELDS } from '../fragments';

export const GET_GATES = gql`
  query GetGates($facilityId: ID!) {
    gates(facilityId: $facilityId) {
      id
      gateName
      gateType
      status
      lanes {
        id
        laneNumber
        direction
        status
        equipment
      }
    }
  }
`;

export const GET_GATE_TRANSACTIONS = gql`
  ${GATE_TRANSACTION_FIELDS}
  ${PAGE_INFO_FIELDS}
  query GetGateTransactions($facilityId: ID!, $status: String, $page: Int, $pageSize: Int) {
    gateTransactions(facilityId: $facilityId, status: $status, page: $page, pageSize: $pageSize) {
      data {
        ...GateTransactionFields
        gate {
          id
          gateName
        }
        lane {
          id
          laneNumber
        }
      }
      pageInfo {
        ...PageInfoFields
      }
    }
  }
`;
