import { gql } from '@apollo/client';

export const GET_OPERATIONS_DASHBOARD = gql`
  query GetOperationsDashboard($facilityId: ID!) {
    operationsDashboard(facilityId: $facilityId) {
      facilityId
      timestamp
      containers {
        total
        byStatus
        bySize
        totalTEU
        reeferCount
        hazmatCount
        onHoldCount
        overdueCount
      }
      rail {
        totalTracks
        availableTracks
        activeRakes
        todayExpectedArrivals
      }
      waterfront {
        totalBerths
        occupiedBerths
        activeVessels
        workingCranes
      }
      equipment {
        totalEquipment
        available
        inUse
        maintenance
        averageUtilization
      }
      billing {
        totalRevenue
        totalOutstanding
        pendingInvoices
        overdueInvoices
      }
      customs {
        totalBOE
        pendingBOE
        clearedBOE
        pendingExaminations
      }
    }
  }
`;

export const GET_TERMINAL_KPIS = gql`
  query GetTerminalKPIs($facilityId: ID!) {
    terminalKPIs(facilityId: $facilityId) {
      totalContainers
      totalTEU
      yardUtilization
      gateTransactionsToday
      averageGateTurnaround
      activeRakes
      activeVessels
      equipmentUtilization
      revenueToday
      pendingCustomsClearance
    }
  }
`;

export const GET_PERFORMANCE_SCORECARD = gql`
  query GetPerformanceScorecard($facilityId: ID!, $period: String) {
    performanceScorecard(facilityId: $facilityId, period: $period) {
      overallGrade
      overallScore
      categories
    }
  }
`;
