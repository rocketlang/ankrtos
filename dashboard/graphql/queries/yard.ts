import { gql } from '@apollo/client';

export const GET_FACILITY = gql`
  query GetFacility($id: ID!) {
    facility(id: $id) {
      id
      name
      code
      type
      status
      zones {
        id
        zoneName
        zoneCode
        zoneType
        blocks {
          id
          blockCode
          blockType
          rows
          columns
          tiers
          capacity
          currentOccupancy
          utilizationPercent
          isReefer
          isHazmat
        }
      }
    }
  }
`;

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
