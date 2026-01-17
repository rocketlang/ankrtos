/**
 * Quick KYC Screen - BFC Staff App
 */

import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface KYCTask {
  id: string;
  customerName: string;
  phone: string;
  type: 'aadhaar' | 'pan' | 'address' | 'photo';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

const kycTasks: KYCTask[] = [
  { id: '1', customerName: 'Rahul Sharma', phone: '+91 98765 43210', type: 'aadhaar', status: 'pending', dueDate: 'Today', priority: 'high' },
  { id: '2', customerName: 'Priya Patel', phone: '+91 87654 32109', type: 'pan', status: 'pending', dueDate: 'Today', priority: 'high' },
  { id: '3', customerName: 'Amit Kumar', phone: '+91 76543 21098', type: 'address', status: 'in_progress', dueDate: 'Tomorrow', priority: 'medium' },
  { id: '4', customerName: 'Neha Singh', phone: '+91 65432 10987', type: 'photo', status: 'pending', dueDate: '2 days', priority: 'low' },
];

const kycTypeConfig: Record<string, { icon: string; label: string; color: string }> = {
  aadhaar: { icon: 'card', label: 'Aadhaar', color: '#3b82f6' },
  pan: { icon: 'document-text', label: 'PAN Card', color: '#8b5cf6' },
  address: { icon: 'location', label: 'Address Proof', color: '#22c55e' },
  photo: { icon: 'camera', label: 'Photo', color: '#f59e0b' },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  high: { bg: '#fee2e2', text: '#dc2626' },
  medium: { bg: '#fef3c7', text: '#d97706' },
  low: { bg: '#dbeafe', text: '#2563eb' },
};

export default function QuickKYCScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredTasks = kycTasks.filter((task) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return task.status === 'pending';
    if (selectedFilter === 'in_progress') return task.status === 'in_progress';
    return true;
  });

  const handleStartKYC = (task: KYCTask) => {
    router.push('/kyc/scan');
  };

  const handleManualEntry = () => {
    Alert.alert(
      'Manual KYC Entry',
      'Select document type to manually enter KYC details',
      [
        { text: 'Aadhaar', onPress: () => {} },
        { text: 'PAN Card', onPress: () => {} },
        { text: 'Address Proof', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('/kyc/scan')}
        >
          <View style={styles.scanIconWrapper}>
            <Ionicons name="scan" size={32} color="#fff" />
          </View>
          <Text style={styles.scanButtonText}>Scan Document</Text>
          <Text style={styles.scanButtonSubtext}>Aadhaar, PAN, or Address</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
          <Ionicons name="create" size={24} color="#3b82f6" />
          <Text style={styles.manualButtonText}>Manual Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{kycTasks.filter(t => t.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{kycTasks.filter(t => t.status === 'in_progress').length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#22c55e' }]}>12</Text>
          <Text style={styles.statLabel}>Today Done</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {[
          { key: 'all', label: 'All Tasks' },
          { key: 'pending', label: 'Pending' },
          { key: 'in_progress', label: 'In Progress' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              selectedFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <View style={styles.taskList}>
        <Text style={styles.sectionTitle}>KYC Tasks ({filteredTasks.length})</Text>

        {filteredTasks.map((task) => {
          const typeConfig = kycTypeConfig[task.type];
          const priorityStyle = priorityColors[task.priority];

          return (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => handleStartKYC(task)}
            >
              <View style={[styles.taskIcon, { backgroundColor: typeConfig.color + '15' }]}>
                <Ionicons name={typeConfig.icon as any} size={24} color={typeConfig.color} />
              </View>

              <View style={styles.taskInfo}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskCustomer}>{task.customerName}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
                    <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
                      {task.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.taskPhone}>{task.phone}</Text>

                <View style={styles.taskMeta}>
                  <View style={styles.taskType}>
                    <Ionicons name="document" size={12} color="#64748b" />
                    <Text style={styles.taskTypeText}>{typeConfig.label}</Text>
                  </View>
                  <View style={styles.taskDue}>
                    <Ionicons name="time" size={12} color="#64748b" />
                    <Text style={styles.taskDueText}>Due: {task.dueDate}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={() => handleStartKYC(task)}
              >
                <Ionicons name="camera" size={18} color="#3b82f6" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* eKYC Option */}
      <View style={styles.ekycSection}>
        <View style={styles.ekycCard}>
          <View style={styles.ekycIcon}>
            <Ionicons name="shield-checkmark" size={28} color="#22c55e" />
          </View>
          <View style={styles.ekycContent}>
            <Text style={styles.ekycTitle}>DigiLocker eKYC</Text>
            <Text style={styles.ekycSubtext}>Instant verification via DigiLocker</Text>
          </View>
          <TouchableOpacity style={styles.ekycButton}>
            <Text style={styles.ekycButtonText}>Start</Text>
          </TouchableOpacity>
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
  quickActions: {
    padding: 16,
    gap: 12,
  },
  scanButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  scanIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scanButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  manualButtonText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
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
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  taskList: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCustomer: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  taskPhone: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  taskType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskTypeText: {
    fontSize: 12,
    color: '#64748b',
  },
  taskDue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDueText: {
    fontSize: 12,
    color: '#64748b',
  },
  startButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ekycSection: {
    padding: 16,
    paddingTop: 8,
  },
  ekycCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  ekycIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ekycContent: {
    flex: 1,
    marginLeft: 12,
  },
  ekycTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  ekycSubtext: {
    fontSize: 13,
    color: '#16a34a',
    marginTop: 2,
  },
  ekycButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ekycButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
