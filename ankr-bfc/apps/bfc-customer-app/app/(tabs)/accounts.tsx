/**
 * Accounts Screen - BFC Customer App
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const accounts = [
  {
    id: 1,
    type: 'SAVINGS',
    name: 'Premium Savings',
    number: '•••• 4521',
    balance: 245678,
    icon: 'wallet',
    color: '#3b82f6',
  },
  {
    id: 2,
    type: 'FD',
    name: 'Tax Saver FD',
    number: 'FD-2024-001',
    balance: 500000,
    icon: 'lock-closed',
    color: '#22c55e',
    maturity: 'Mar 2025',
    rate: '7.5%',
  },
];

const loans = [
  {
    id: 1,
    type: 'HOME_LOAN',
    name: 'Home Loan',
    number: 'HL-2021-456',
    outstanding: 2500000,
    emi: 24500,
    nextDue: '15 Feb 2024',
    icon: 'home',
    color: '#8b5cf6',
  },
];

const cards = [
  {
    id: 1,
    type: 'CREDIT_CARD',
    name: 'Platinum Card',
    number: '•••• 8765',
    limit: 300000,
    used: 45000,
    icon: 'card',
    color: '#f59e0b',
  },
];

export default function AccountsScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Accounts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accounts</Text>
        {accounts.map((account) => (
          <TouchableOpacity key={account.id} style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: account.color + '15' }]}>
              <Ionicons name={account.icon as any} size={24} color={account.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{account.name}</Text>
              <Text style={styles.cardNumber}>{account.number}</Text>
              {account.maturity && (
                <Text style={styles.cardMeta}>Maturity: {account.maturity} • {account.rate} p.a.</Text>
              )}
            </View>
            <View style={styles.cardBalance}>
              <Text style={styles.balanceAmount}>₹{account.balance.toLocaleString()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loans Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Loans</Text>
        {loans.map((loan) => (
          <TouchableOpacity key={loan.id} style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: loan.color + '15' }]}>
              <Ionicons name={loan.icon as any} size={24} color={loan.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{loan.name}</Text>
              <Text style={styles.cardNumber}>{loan.number}</Text>
              <Text style={styles.cardMeta}>EMI ₹{loan.emi.toLocaleString()} • Due {loan.nextDue}</Text>
            </View>
            <View style={styles.cardBalance}>
              <Text style={[styles.balanceAmount, { color: '#dc2626' }]}>
                ₹{loan.outstanding.toLocaleString()}
              </Text>
              <Text style={styles.balanceLabel}>Outstanding</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.payEmiButton}>
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.payEmiText}>Pay EMI</Text>
        </TouchableOpacity>
      </View>

      {/* Cards Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cards</Text>
        {cards.map((card) => (
          <TouchableOpacity key={card.id} style={styles.card}>
            <View style={[styles.cardIcon, { backgroundColor: card.color + '15' }]}>
              <Ionicons name={card.icon as any} size={24} color={card.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{card.name}</Text>
              <Text style={styles.cardNumber}>{card.number}</Text>
              <View style={styles.limitBar}>
                <View
                  style={[
                    styles.limitUsed,
                    { width: `${(card.used / card.limit) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.cardMeta}>
                ₹{card.used.toLocaleString()} of ₹{card.limit.toLocaleString()} used
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardNumber: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  cardBalance: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  payEmiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  payEmiText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  limitBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  limitUsed: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
});
