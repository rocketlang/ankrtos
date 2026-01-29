import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useLazyQuery, useSubscription } from '@apollo/client';
import { useFacility } from '@/hooks/use-facility';
import { GET_CONTAINERS, SEARCH_CONTAINER } from '@/graphql/queries';
import { ON_CONTAINER_STATUS_CHANGED } from '@/graphql/subscriptions';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCard } from '@/components/StatCard';

export default function YardScreen() {
  const { facilityId } = useFacility();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, refetch } = useQuery(GET_CONTAINERS, {
    variables: { facilityId, page: 1, pageSize: 50 },
    skip: !facilityId,
  });

  const [searchContainer, { data: searchData }] = useLazyQuery(SEARCH_CONTAINER);

  const { data: liveData } = useSubscription(ON_CONTAINER_STATUS_CHANGED, {
    variables: { facilityId },
    skip: !facilityId,
  });

  useEffect(() => {
    if (liveData?.containerStatusChanged) refetch();
  }, [liveData, refetch]);

  const containers = data?.containers?.data ?? [];
  const total = data?.containers?.pageInfo?.total ?? 0;
  const searchResult = searchData?.containerByNumber;

  const handleSearch = useCallback(() => {
    if (searchText.trim()) {
      searchContainer({ variables: { containerNumber: searchText.trim().toUpperCase() } });
    }
  }, [searchText, searchContainer]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const displayData = searchResult ? [searchResult] : containers;

  if (!facilityId) {
    return <View style={styles.empty}><Text style={styles.emptyText}>Select a facility first</Text></View>;
  }

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard title="Containers" value={total} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search container number..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          autoCapitalize="characters"
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {searchResult && (
        <TouchableOpacity style={styles.clearSearch} onPress={() => { setSearchText(''); }}>
          <Text style={styles.clearSearchText}>Clear search</Text>
        </TouchableOpacity>
      )}

      {/* Container List */}
      <FlatList
        data={displayData}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{loading ? 'Loading...' : 'No containers found'}</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/container/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.containerNum}>{item.containerNumber}</Text>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.detail}>Type: {item.isoType} | {item.size}ft | {item.type}</Text>
              <Text style={styles.detail}>Owner: {item.owner ?? '-'}</Text>
              {item.currentLocation && (
                <Text style={styles.detail}>Location: {typeof item.currentLocation === 'string' ? item.currentLocation : JSON.stringify(item.currentLocation)}</Text>
              )}
              {item.customsStatus && <Text style={styles.detail}>Customs: {item.customsStatus}</Text>}
              {item.holds?.length > 0 && (
                <Text style={[styles.detail, { color: '#DC2626' }]}>Holds: {item.holds.length}</Text>
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
  statsRow: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  clearSearch: { paddingHorizontal: 16, marginBottom: 4 },
  clearSearchText: { color: '#2563EB', fontSize: 13, fontWeight: '500' },
  list: { padding: 16, paddingTop: 0 },
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
  containerNum: { fontSize: 16, fontWeight: '700', color: '#111827', fontFamily: 'monospace' },
  cardDetails: { marginTop: 8, gap: 2 },
  detail: { fontSize: 13, color: '#6B7280' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
