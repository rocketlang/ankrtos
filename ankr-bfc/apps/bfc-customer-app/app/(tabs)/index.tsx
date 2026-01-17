/**
 * Home Screen - BFC Customer App
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const quickActions = [
  { icon: 'send', label: 'Transfer', color: '#3b82f6' },
  { icon: 'qr-code', label: 'Pay', color: '#22c55e' },
  { icon: 'card', label: 'Cards', color: '#f59e0b' },
  { icon: 'receipt', label: 'Bills', color: '#8b5cf6' },
];

const recentTransactions = [
  { id: 1, name: 'Amazon', type: 'Shopping', amount: -2499, date: 'Today' },
  { id: 2, name: 'Salary Credit', type: 'Income', amount: 85000, date: 'Yesterday' },
  { id: 3, name: 'Swiggy', type: 'Food', amount: -450, date: 'Yesterday' },
  { id: 4, name: 'Netflix', type: 'Entertainment', amount: -649, date: '2 days ago' },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>₹2,45,678</Text>
        <View style={styles.accountInfo}>
          <Text style={styles.accountText}>Savings A/C •••• 4521</Text>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity key={action.label} style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Offers Banner */}
      <Link href="/offers" asChild>
        <TouchableOpacity style={styles.offerBanner}>
          <View style={styles.offerContent}>
            <Ionicons name="gift" size={32} color="#fff" />
            <View style={styles.offerText}>
              <Text style={styles.offerTitle}>Pre-approved Loan</Text>
              <Text style={styles.offerSubtitle}>Up to ₹10,00,000 at 10.5% p.a.</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </Link>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.map((txn) => (
          <View key={txn.id} style={styles.transactionItem}>
            <View style={styles.txnIcon}>
              <Ionicons
                name={txn.amount > 0 ? 'arrow-down' : 'arrow-up'}
                size={20}
                color={txn.amount > 0 ? '#22c55e' : '#64748b'}
              />
            </View>
            <View style={styles.txnDetails}>
              <Text style={styles.txnName}>{txn.name}</Text>
              <Text style={styles.txnType}>{txn.type} • {txn.date}</Text>
            </View>
            <Text style={[styles.txnAmount, txn.amount > 0 && styles.txnPositive]}>
              {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  balanceCard: {
    backgroundColor: '#2563eb',
    margin: 16,
    padding: 24,
    borderRadius: 16,
  },
  balanceLabel: {
    color: '#93c5fd',
    fontSize: 14,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginTop: 4,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  accountText: {
    color: '#93c5fd',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
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
  offerBanner: {
    backgroundColor: '#8b5cf6',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  offerText: {
    gap: 2,
  },
  offerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  offerSubtitle: {
    color: '#ddd6fe',
    fontSize: 13,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  seeAll: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txnDetails: {
    flex: 1,
    marginLeft: 12,
  },
  txnName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  txnType: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  txnPositive: {
    color: '#22c55e',
  },
});
