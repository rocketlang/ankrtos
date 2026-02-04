import { useQuery, gql } from '@apollo/client';

export const GET_FLEET_METRICS = gql`
  query GetFleetMetrics($range: String) {
    fleetMetrics(range: $range) {
      totalVehicles runningLoaded runningEmpty idleAtClient idleBetweenTrips
      maintenance parked utilizationPercent totalDemurrageHours avgDemurragePerTrip
      demurrageCost topDemurrageLocations { name hours cost }
      avgTripTime benchmarkTripTime tripTimeVariance onTimeDeliveryPercent
      criticalAlerts warningAlerts upcomingService
      alerts { id type vehicle message action time }
    }
  }
`;

export function useFleetMetrics(range = 'week') {
  const { data, loading, error, refetch } = useQuery(GET_FLEET_METRICS, {
    variables: { range }, pollInterval: 30000, fetchPolicy: 'cache-and-network'
  });
  return { metrics: data?.fleetMetrics || null, loading, error, refetch };
}
