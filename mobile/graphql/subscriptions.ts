import { gql } from '@apollo/client';

export const ON_GATE_TRANSACTION_UPDATED = gql`
  subscription OnGateTransactionUpdated($facilityId: ID!) {
    gateTransactionUpdated(facilityId: $facilityId) {
      id
      transactionNumber
      transactionType
      truckNumber
      status
      arrivalTime
    }
  }
`;

export const ON_CONTAINER_STATUS_CHANGED = gql`
  subscription OnContainerStatusChanged($facilityId: ID!) {
    containerStatusChanged(facilityId: $facilityId) {
      id
      containerNumber
      status
      customsStatus
      currentLocation
    }
  }
`;

export const ON_CONTAINER_MOVED = gql`
  subscription OnContainerMoved($facilityId: ID!) {
    containerMoved(facilityId: $facilityId) {
      id
      containerNumber
      fromLocation
      toLocation
      moveType
    }
  }
`;

export const ON_EQUIPMENT_ALERT = gql`
  subscription OnEquipmentAlert($facilityId: ID!) {
    equipmentAlert(facilityId: $facilityId) {
      id
      equipmentCode
      alertType
      severity
      message
    }
  }
`;
