import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useSubscription } from '@apollo/client';
import { useFacility } from '@/hooks/use-facility';
import { GET_EQUIPMENT } from '@/graphql/queries';
import { ON_EQUIPMENT_ALERT } from '@/graphql/subscriptions';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';

export default function EquipmentScreen() {
  const { facilityId } = useFacility();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data, loading, refetch } = useQuery(GET_EQUIPMENT, {
    variables: { facilityId, type: typeFilter || undefined },
    skip: !facilityId,
  });

  const { data: alertData } = useSubscription(ON_EQUIPMENT_ALERT, {
    variables: { facilityId },
    skip: !facilityId,
  });

  useEffect(() => {
    if (alertData?.equipmentAlert) refetch();
  }, [alertData, refetch]);

  const equipmentList = data?.equipment ?? [];

  const activeCount = equipmentList.filter((e: any) => e.status === 'active').length;
  const maintenanceCount = equipmentList.filter((e: any) => e.status === 'maintenance').length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!facilityId) {
    return <View style={styles.empty}><Text style={styles.emptyText}>Select a facility first</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard title="Total" value={equipmentList.length} />
        <StatCard title="Active" value={activeCount} color="#22C55E" />
        <StatCard title="Maintenance" value={maintenanceCount} color="#F59E0B" />
      </View>

      {/* Equipment List */}
      <FlatList
        data={equipmentList}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No equipment found'}</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/equipment/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.equipCode}>{item.equipmentCode}</Text>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.detail}>Type: {item.equipmentType}</Text>
              <Text style={styles.detail}>{item.make} {item.model}</Text>
              {item.fuelLevel != null && (
                <Text style={[styles.detail, item.fuelLevel < 20 ? { color: '#DC2626' } : {}]}>
                  Fuel: {item.fuelLevel}%
                </Text>
              )}
              <Text style={styles.detail}>Hours: {item.hoursOperated ?? '-'}</Text>
              {item.nextMaintenanceDue && (
                <Text style={styles.detail}>Next maintenance: {new Date(item.nextMaintenanceDue).toLocaleDateString()}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  statsRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 0 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipCode: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardDetails: { marginTop: 8, gap: 2 },
  detail: { fontSize: 13, color: '#6B7280' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
