import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { GET_EQUIPMENT_BY_ID } from '@/graphql/queries';
import { UPDATE_EQUIPMENT_STATUS } from '@/graphql/mutations';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/hooks/use-auth';

export default function EquipmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { canMutate } = useAuth();

  const { data, loading, refetch } = useQuery(GET_EQUIPMENT_BY_ID, {
    variables: { id },
    skip: !id,
  });

  const [updateStatus] = useMutation(UPDATE_EQUIPMENT_STATUS);

  const equipment = data?.equipmentById;

  const handleStatusUpdate = (newStatus: string) => {
    Alert.alert(
      'Update Status',
      `Change equipment status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateStatus({ variables: { id, status: newStatus } });
              refetch();
            } catch (err) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <View style={styles.empty}><Text style={styles.emptyText}>Loading...</Text></View>;
  }

  if (!equipment) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Equipment not found</Text>
        <Text style={styles.id}>ID: {id}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{equipment.equipmentCode}</Text>
        <StatusBadge status={equipment.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Equipment Details</Text>
        {[
          ['Type', equipment.equipmentType],
          ['Make / Model', `${equipment.make ?? '-'} ${equipment.model ?? ''}`],
          ['Location', equipment.currentLocation ?? '-'],
          ['Fuel Level', equipment.fuelLevel != null ? `${equipment.fuelLevel}%` : '-'],
          ['Hours Operated', equipment.hoursOperated ?? '-'],
          ['Operator', equipment.operatorName ?? '-'],
          ['Last Maintenance', equipment.lastMaintenanceDate ? new Date(equipment.lastMaintenanceDate).toLocaleDateString() : '-'],
          ['Next Maintenance', equipment.nextMaintenanceDue ? new Date(equipment.nextMaintenanceDue).toLocaleDateString() : '-'],
        ].map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>

      {canMutate('equipment') && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Actions</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.activeBtn]} onPress={() => handleStatusUpdate('active')}>
              <Text style={styles.actionBtnText}>Set Active</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.maintenanceBtn]} onPress={() => handleStatusUpdate('maintenance')}>
              <Text style={styles.actionBtnText}>Maintenance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.breakdownBtn]} onPress={() => handleStatusUpdate('breakdown')}>
              <Text style={styles.actionBtnText}>Breakdown</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  id: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontFamily: 'monospace' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: { fontSize: 14, color: '#6B7280' },
  value: { fontSize: 14, fontWeight: '500', color: '#111827' },
  actions: { gap: 10 },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  activeBtn: { backgroundColor: '#22C55E' },
  maintenanceBtn: { backgroundColor: '#F59E0B' },
  breakdownBtn: { backgroundColor: '#EF4444' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
