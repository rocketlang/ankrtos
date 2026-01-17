/**
 * Field Operations Screen - BFC Staff App
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FieldVisit {
  id: string;
  customerName: string;
  address: string;
  type: 'verification' | 'collection' | 'survey' | 'delivery';
  status: 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
  scheduledTime: string;
  distance: string;
}

const fieldVisits: FieldVisit[] = [
  {
    id: '1',
    customerName: 'Rahul Sharma',
    address: '123 MG Road, Andheri West, Mumbai 400053',
    type: 'verification',
    status: 'scheduled',
    scheduledTime: '10:00 AM',
    distance: '2.5 km',
  },
  {
    id: '2',
    customerName: 'Priya Patel',
    address: '456 SV Road, Borivali East, Mumbai 400066',
    type: 'collection',
    status: 'scheduled',
    scheduledTime: '11:30 AM',
    distance: '8.2 km',
  },
  {
    id: '3',
    customerName: 'Amit Kumar',
    address: '789 Link Road, Malad West, Mumbai 400064',
    type: 'survey',
    status: 'in_transit',
    scheduledTime: '2:00 PM',
    distance: '5.1 km',
  },
];

const visitTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
  verification: { icon: 'shield-checkmark', label: 'Address Verification', color: '#3b82f6' },
  collection: { icon: 'cash', label: 'Collection', color: '#22c55e' },
  survey: { icon: 'clipboard', label: 'Site Survey', color: '#8b5cf6' },
  delivery: { icon: 'cube', label: 'Document Delivery', color: '#f59e0b' },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  scheduled: { color: '#3b82f6', label: 'Scheduled' },
  in_transit: { color: '#f59e0b', label: 'In Transit' },
  completed: { color: '#22c55e', label: 'Completed' },
  cancelled: { color: '#ef4444', label: 'Cancelled' },
};

export default function FieldOpsScreen() {
  const [currentLocation, setCurrentLocation] = useState<string>('Getting location...');
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow' | 'week'>('today');

  useEffect(() => {
    // Simulate getting location
    setTimeout(() => {
      setCurrentLocation('Andheri West, Mumbai');
    }, 1000);
  }, []);

  const handleStartNavigation = (visit: FieldVisit) => {
    Alert.alert(
      'Start Navigation',
      `Navigate to ${visit.customerName}'s address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Maps', onPress: () => {} },
      ]
    );
  };

  const handleCheckIn = (visit: FieldVisit) => {
    Alert.alert(
      'Check In',
      'Confirm you have arrived at the location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check In', onPress: () => {} },
      ]
    );
  };

  const handleCompleteVisit = (visit: FieldVisit) => {
    Alert.alert(
      'Complete Visit',
      'Mark this visit as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Notes & Complete', onPress: () => {} },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Current Location */}
      <View style={styles.locationCard}>
        <View style={styles.locationIcon}>
          <Ionicons name="location" size={20} color="#3b82f6" />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Current Location</Text>
          <Text style={styles.locationText}>{currentLocation}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Today's Visits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>2</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>3</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="add" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.actionLabel}>New Visit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="checkmark-done" size={24} color="#22c55e" />
          </View>
          <Text style={styles.actionLabel}>Log Visit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="time" size={24} color="#f59e0b" />
          </View>
          <Text style={styles.actionLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="map" size={24} color="#8b5cf6" />
          </View>
          <Text style={styles.actionLabel}>Route</Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter */}
      <View style={styles.dateFilters}>
        {[
          { key: 'today', label: 'Today' },
          { key: 'tomorrow', label: 'Tomorrow' },
          { key: 'week', label: 'This Week' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.dateChip,
              selectedDate === filter.key && styles.dateChipActive,
            ]}
            onPress={() => setSelectedDate(filter.key as any)}
          >
            <Text
              style={[
                styles.dateChipText,
                selectedDate === filter.key && styles.dateChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Visit List */}
      <View style={styles.visitList}>
        <Text style={styles.sectionTitle}>Scheduled Visits</Text>

        {fieldVisits.map((visit) => {
          const typeConfig = visitTypeConfig[visit.type];
          const status = statusConfig[visit.status];

          return (
            <View key={visit.id} style={styles.visitCard}>
              <View style={styles.visitHeader}>
                <View style={[styles.visitTypeIcon, { backgroundColor: typeConfig.color + '15' }]}>
                  <Ionicons name={typeConfig.icon as any} size={20} color={typeConfig.color} />
                </View>
                <View style={styles.visitHeaderInfo}>
                  <Text style={styles.visitType}>{typeConfig.label}</Text>
                  <View style={styles.visitTime}>
                    <Ionicons name="time-outline" size={12} color="#64748b" />
                    <Text style={styles.visitTimeText}>{visit.scheduledTime}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.visitCustomer}>
                <Text style={styles.customerName}>{visit.customerName}</Text>
                <View style={styles.distanceBadge}>
                  <Ionicons name="navigate" size={12} color="#64748b" />
                  <Text style={styles.distanceText}>{visit.distance}</Text>
                </View>
              </View>

              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <Text style={styles.addressText} numberOfLines={2}>{visit.address}</Text>
              </View>

              <View style={styles.visitActions}>
                <TouchableOpacity
                  style={[styles.visitButton, styles.visitButtonPrimary]}
                  onPress={() => handleStartNavigation(visit)}
                >
                  <Ionicons name="navigate" size={16} color="#fff" />
                  <Text style={styles.visitButtonText}>Navigate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.visitButton, styles.visitButtonSecondary]}
                  onPress={() => handleCheckIn(visit)}
                >
                  <Ionicons name="location" size={16} color="#3b82f6" />
                  <Text style={[styles.visitButtonText, { color: '#3b82f6' }]}>Check In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.visitButton, styles.visitButtonSuccess]}
                  onPress={() => handleCompleteVisit(visit)}
                >
                  <Ionicons name="checkmark" size={16} color="#22c55e" />
                  <Text style={[styles.visitButtonText, { color: '#22c55e' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Daily Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Ionicons name="walk" size={20} color="#64748b" />
            <Text style={styles.summaryValue}>12.5 km</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="time" size={20} color="#64748b" />
            <Text style={styles.summaryValue}>4.5 hrs</Text>
            <Text style={styles.summaryLabel}>Time</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={20} color="#64748b" />
            <Text style={styles.summaryValue}>2/5</Text>
            <Text style={styles.summaryLabel}>Visits</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  dateFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateChipActive: {
    backgroundColor: '#1e293b',
    borderColor: '#1e293b',
  },
  dateChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  dateChipTextActive: {
    color: '#fff',
  },
  visitList: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  visitTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitHeaderInfo: {
    flex: 1,
    marginLeft: 10,
  },
  visitType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  visitTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  visitTimeText: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  visitCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  visitActions: {
    flexDirection: 'row',
    gap: 8,
  },
  visitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  visitButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  visitButtonSecondary: {
    backgroundColor: '#eff6ff',
  },
  visitButtonSuccess: {
    backgroundColor: '#f0fdf4',
  },
  visitButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});
