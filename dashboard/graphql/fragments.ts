import { gql } from '@apollo/client';

export const CONTAINER_FIELDS = gql`
  fragment ContainerFields on Container {
    id
    containerNumber
    isoType
    size
    type
    status
    condition
    owner
    ownerName
    grossWeight
    currentLocation
    customsStatus
    gateInTime
    freeTimeExpiry
    createdAt
    updatedAt
  }
`;

export const GATE_TRANSACTION_FIELDS = gql`
  fragment GateTransactionFields on GateTransaction {
    id
    transactionNumber
    transactionType
    truckNumber
    driverName
    driverLicense
    containerNumber
    status
    arrivalTime
    completionTime
    totalProcessingMinutes
    createdAt
  }
`;

export const PAGE_INFO_FIELDS = gql`
  fragment PageInfoFields on PageInfo {
    total
    page
    pageSize
    totalPages
    hasNext
    hasPrevious
  }
`;
