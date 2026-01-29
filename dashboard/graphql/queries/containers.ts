import { gql } from '@apollo/client';
import { CONTAINER_FIELDS, PAGE_INFO_FIELDS } from '../fragments';

export const GET_CONTAINERS = gql`
  ${CONTAINER_FIELDS}
  ${PAGE_INFO_FIELDS}
  query GetContainers($facilityId: ID!, $status: String, $page: Int, $pageSize: Int) {
    containers(facilityId: $facilityId, status: $status, page: $page, pageSize: $pageSize) {
      data {
        ...ContainerFields
        holds {
          id
          type
          reason
          priority
          status
        }
      }
      pageInfo {
        ...PageInfoFields
      }
    }
  }
`;

export const GET_CONTAINER = gql`
  ${CONTAINER_FIELDS}
  query GetContainer($id: ID!) {
    container(id: $id) {
      ...ContainerFields
      holds {
        id
        type
        reason
        priority
        status
        placedAt
        releasedAt
      }
      movements {
        id
        moveType
        fromLocation
        toLocation
        movedAt
        equipmentUsed
      }
    }
  }
`;

export const SEARCH_CONTAINER = gql`
  ${CONTAINER_FIELDS}
  query SearchContainer($containerNumber: String!) {
    containerByNumber(containerNumber: $containerNumber) {
      ...ContainerFields
    }
  }
`;

export const GET_CONTAINER_STATS = gql`
  query GetContainerStats($facilityId: ID!) {
    containerStats(facilityId: $facilityId) {
      total
      byStatus
      bySize
      totalTEU
      reeferCount
      hazmatCount
      onHoldCount
      overdueCount
      averageDwellDays
    }
  }
`;
