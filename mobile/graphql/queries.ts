import { gql } from '@apollo/client';

export const GET_FACILITIES = gql`
  query GetFacilities($tenantId: ID!) {
    facilities(tenantId: $tenantId) {
      id
      name
      code
      type
      status
    }
  }
`;

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
      }
    }
  }
`;

export const GET_GATE_TRANSACTIONS = gql`
  query GetGateTransactions($facilityId: ID!, $status: String, $page: Int, $pageSize: Int) {
    gateTransactions(facilityId: $facilityId, status: $status, page: $page, pageSize: $pageSize) {
      data {
        id
        transactionNumber
        transactionType
        truckNumber
        driverName
        containerNumber
        status
        arrivalTime
        completionTime
        totalProcessingMinutes
        createdAt
      }
      pageInfo {
        total
        page
        pageSize
        totalPages
        hasNext
      }
    }
  }
`;

export const GET_CONTAINERS = gql`
  query GetContainers($facilityId: ID!, $status: String, $page: Int, $pageSize: Int) {
    containers(facilityId: $facilityId, status: $status, page: $page, pageSize: $pageSize) {
      data {
        id
        containerNumber
        isoType
        size
        type
        status
        owner
        currentLocation
        customsStatus
        gateInTime
        createdAt
        holds {
          id
          type
          reason
          status
        }
      }
      pageInfo {
        total
        page
        pageSize
        totalPages
        hasNext
      }
    }
  }
`;

export const SEARCH_CONTAINER = gql`
  query SearchContainer($containerNumber: String!) {
    containerByNumber(containerNumber: $containerNumber) {
      id
      containerNumber
      isoType
      size
      type
      status
      owner
      currentLocation
      customsStatus
      gateInTime
      holds {
        id
        type
        reason
        status
      }
    }
  }
`;

export const GET_EQUIPMENT = gql`
  query GetEquipment($facilityId: ID!, $type: String, $status: String) {
    equipment(facilityId: $facilityId, type: $type, status: $status) {
      id
      equipmentCode
      equipmentType
      make
      model
      status
      currentLocation
      fuelLevel
      hoursOperated
      lastMaintenanceDate
      nextMaintenanceDue
    }
  }
`;

export const GET_EQUIPMENT_BY_ID = gql`
  query GetEquipmentById($id: ID!) {
    equipmentById(id: $id) {
      id
      equipmentCode
      equipmentType
      make
      model
      status
      currentLocation
      fuelLevel
      hoursOperated
      lastMaintenanceDate
      nextMaintenanceDue
      operatorId
      operatorName
    }
  }
`;
