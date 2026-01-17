/**
 * Dashboard Screen - BFC Staff App
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const stats = [
  { label: 'Tasks Today', value: 12, icon: 'checkmark-circle', color: '#3b82f6' },
  { label: 'Pending KYC', value: 5, icon: 'document', color: '#f59e0b' },
  { label: 'Field Visits', value: 3, icon: 'location', color: '#22c55e' },
  { label: 'Leads', value: 8, icon: 'people', color: '#8b5cf6' },
];

const recentCustomers = [
  { id: '1', name: 'Rahul Sharma', action: 'KYC Verified', time: '10 min ago' },
  { id: '2', name: 'Priya Patel', action: 'Loan Inquiry', time: '25 min ago' },
  { id: '3', name: 'Amit Kumar', action: 'Document Pending', time: '1 hr ago' },
];

const quickActions = [
  { label: 'New Customer', icon: 'person-add', route: '/lookup', color: '#3b82f6' },
  { label: 'Scan KYC', icon: 'scan', route: '/kyc', color: '#22c55e' },
  { label: 'Log Visit', icon: 'navigate', route: '/fieldops', color: '#f59e0b' },
  { label: 'Reports', icon: 'stats-chart', route: '/reports', color: '#8b5cf6' },
];

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Welcome */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.userName}>Amit Shah</Text>
        </View>
        <View style={styles.branchBadge}>
          <Ionicons name="business" size={14} color="#3b82f6" />
          <Text style={styles.branchText}>MUM001</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.route as any} asChild>
              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={28} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentCustomers.map((customer) => (
            <Link key={customer.id} href={`/customer/${customer.id}`} asChild>
              <TouchableOpacity style={styles.activityItem}>
                <View style={styles.activityAvatar}>
                  <Text style={styles.avatarText}>{customer.name.charAt(0)}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityName}>{customer.name}</Text>
                  <Text style={styles.activityAction}>{customer.action}</Text>
                </View>
                <Text style={styles.activityTime}>{customer.time}</Text>
              </TouchableOpacity>
            </Link>
          ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    color: '#94a3b8',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  branchText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  activityAction: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
