import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useSubscription } from '@apollo/client';
import { useFacility } from '@/hooks/use-facility';
import { GET_GATE_TRANSACTIONS } from '@/graphql/queries';
import { ON_GATE_TRANSACTION_UPDATED } from '@/graphql/subscriptions';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';
import { LiveDot } from '@/components/LiveDot';

export default function GateScreen() {
  const { facilityId } = useFacility();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, refetch } = useQuery(GET_GATE_TRANSACTIONS, {
    variables: { facilityId, status: 'in_progress', page: 1, pageSize: 50 },
    skip: !facilityId,
  });

  const { data: liveData } = useSubscription(ON_GATE_TRANSACTION_UPDATED, {
    variables: { facilityId },
    skip: !facilityId,
  });

  useEffect(() => {
    if (liveData?.gateTransactionUpdated) refetch();
  }, [liveData, refetch]);

  const transactions = data?.gateTransactions?.data ?? [];
  const total = data?.gateTransactions?.pageInfo?.total ?? 0;

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
        <StatCard title="Active" value={total} color="#2563EB" />
        <StatCard title="Live" value={liveData ? 'Yes' : '-'} color="#22C55E" />
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No active transactions'}</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={styles.txCard}
            onPress={() => router.push(`/gate/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.txHeader}>
              <Text style={styles.txNumber}>{item.transactionNumber}</Text>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.txDetail}>Truck: {item.truckNumber ?? '-'}</Text>
              <Text style={styles.txDetail}>Driver: {item.driverName ?? '-'}</Text>
              <Text style={styles.txDetail}>Container: {item.containerNumber ?? '-'}</Text>
              <Text style={styles.txDetail}>Type: {item.transactionType === 'gate_in' ? 'Gate In' : 'Gate Out'}</Text>
            </View>
            {item.arrivalTime && (
              <Text style={styles.txTime}>Arrived: {new Date(item.arrivalTime).toLocaleTimeString()}</Text>
            )}
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
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txNumber: { fontSize: 15, fontWeight: '600', color: '#111827' },
  txDetails: { marginTop: 8, gap: 2 },
  txDetail: { fontSize: 13, color: '#6B7280' },
  txTime: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
