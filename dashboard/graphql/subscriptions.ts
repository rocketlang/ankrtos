import { gql } from '@apollo/client';

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

export const ON_RAKE_STATUS_CHANGED = gql`
  subscription OnRakeStatusChanged($facilityId: ID!) {
    rakeStatusChanged(facilityId: $facilityId) {
      id
      rakeNumber
      status
      trackId
    }
  }
`;

export const ON_VESSEL_STATUS_CHANGED = gql`
  subscription OnVesselStatusChanged($facilityId: ID!) {
    vesselStatusChanged(facilityId: $facilityId) {
      id
      vesselName
      status
      berthId
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

export const ON_YARD_CAPACITY_ALERT = gql`
  subscription OnYardCapacityAlert($facilityId: ID!) {
    yardCapacityAlert(facilityId: $facilityId) {
      blockId
      blockCode
      utilizationPercent
      alertLevel
    }
  }
`;

export const ON_REEFER_ALARM = gql`
  subscription OnReeferAlarm($facilityId: ID!) {
    reeferAlarm(facilityId: $facilityId) {
      containerId
      containerNumber
      alarmType
      temperature
      setPoint
    }
  }
`;

export const ON_SENSOR_ALERT = gql`
  subscription OnSensorAlert($facilityId: ID!) {
    sensorAlert(facilityId: $facilityId) {
      sensorId
      sensorType
      alertType
      value
      threshold
    }
  }
`;

export const ON_OPERATION_COMPLETED = gql`
  subscription OnOperationCompleted($facilityId: ID!) {
    operationCompleted(facilityId: $facilityId) {
      operationType
      operationId
      status
      completedAt
    }
  }
`;

export const ON_DOCUMENT_ISSUED = gql`
  subscription OnDocumentIssued($facilityId: ID!) {
    documentIssued(facilityId: $facilityId) {
      documentType
      documentId
      documentNumber
      issuedAt
    }
  }
`;
