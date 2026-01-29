import { gql } from '@apollo/client';

export const START_GATE_IN = gql`
  mutation StartGateIn($facilityId: ID!, $input: GateInInput!) {
    startGateIn(facilityId: $facilityId, input: $input) {
      success
      data {
        id
        transactionNumber
        status
      }
      error
    }
  }
`;

export const COMPLETE_GATE_IN = gql`
  mutation CompleteGateIn($transactionId: ID!) {
    completeGateIn(transactionId: $transactionId) {
      success
      data {
        id
        transactionNumber
        status
        completionTime
      }
      error
    }
  }
`;

export const START_GATE_OUT = gql`
  mutation StartGateOut($facilityId: ID!, $input: GateOutInput!) {
    startGateOut(facilityId: $facilityId, input: $input) {
      success
      data {
        id
        transactionNumber
        status
      }
      error
    }
  }
`;

export const COMPLETE_GATE_OUT = gql`
  mutation CompleteGateOut($transactionId: ID!) {
    completeGateOut(transactionId: $transactionId) {
      success
      data {
        id
        transactionNumber
        status
        completionTime
      }
      error
    }
  }
`;

export const UPDATE_EQUIPMENT_STATUS = gql`
  mutation UpdateEquipmentStatus($id: ID!, $status: String!, $notes: String) {
    updateEquipmentStatus(id: $id, status: $status, notes: $notes) {
      success
      data {
        id
        equipmentCode
        status
      }
      error
    }
  }
`;

export const SCHEDULE_MAINTENANCE = gql`
  mutation ScheduleMaintenance($id: ID!, $input: MaintenanceInput!) {
    scheduleMaintenance(id: $id, input: $input) {
      success
      data {
        id
        equipmentCode
        status
        nextMaintenanceDue
      }
      error
    }
  }
`;
