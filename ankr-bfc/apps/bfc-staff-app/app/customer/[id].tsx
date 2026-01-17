/**
 * Customer Detail Screen - BFC Staff App
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock customer data
const mockCustomer = {
  id: '1',
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@email.com',
  pan: 'ABCDE1234F',
  aadhaar: '••••••••1234',
  kycStatus: 'verified',
  segment: 'Premium',
  riskScore: 0.25,
  trustScore: 0.85,
  address: '123 MG Road, Andheri West, Mumbai 400053',
  products: [
    { type: 'Savings Account', id: 'SA001234567', balance: '₹2,45,000', status: 'active' },
    { type: 'Home Loan', id: 'HL001234567', balance: '₹45,00,000', status: 'active' },
    { type: 'Credit Card', id: 'CC001234567', balance: '₹35,000', status: 'active' },
  ],
  recentActivity: [
    { type: 'KYC Verified', date: '2 days ago', icon: 'shield-checkmark', color: '#22c55e' },
    { type: 'Loan EMI Paid', date: '5 days ago', icon: 'cash', color: '#3b82f6' },
    { type: 'Address Updated', date: '1 week ago', icon: 'location', color: '#8b5cf6' },
  ],
};

const kycStatusColors: Record<string, { bg: string; text: string; icon: string }> = {
  verified: { bg: '#dcfce7', text: '#16a34a', icon: 'checkmark-circle' },
  pending: { bg: '#fef3c7', text: '#d97706', icon: 'time' },
  expired: { bg: '#fee2e2', text: '#dc2626', icon: 'alert-circle' },
};

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const customer = mockCustomer;

  const kycStyle = kycStatusColors[customer.kycStatus] || kycStatusColors.pending;

  const getRiskColor = (score: number) => {
    if (score < 0.3) return '#22c55e';
    if (score < 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const handleCall = () => {
    Linking.openURL(`tel:${customer.phone.replace(/\s/g, '')}`);
  };

  const handleWhatsApp = () => {
    const phoneNumber = customer.phone.replace(/[^\d]/g, '');
    Linking.openURL(`whatsapp://send?phone=${phoneNumber}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: customer.name }} />
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{customer.name}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: kycStyle.bg }]}>
              <Ionicons name={kycStyle.icon as any} size={14} color={kycStyle.text} />
              <Text style={[styles.badgeText, { color: kycStyle.text }]}>
                KYC {customer.kycStatus.toUpperCase()}
              </Text>
            </View>
            <View style={styles.segmentBadge}>
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text style={styles.segmentText}>{customer.segment}</Text>
            </View>
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.contactActions}>
          <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
            <View style={[styles.contactIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="call" size={22} color="#22c55e" />
            </View>
            <Text style={styles.contactLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
            <View style={[styles.contactIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#059669" />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <View style={[styles.contactIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="mail" size={22} color="#3b82f6" />
            </View>
            <Text style={styles.contactLabel}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton}>
            <View style={[styles.contactIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="navigate" size={22} color="#f59e0b" />
            </View>
            <Text style={styles.contactLabel}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Risk Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <View style={styles.scoreCards}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Risk Score</Text>
              <View style={styles.scoreRow}>
                <View
                  style={[
                    styles.scoreDot,
                    { backgroundColor: getRiskColor(customer.riskScore) },
                  ]}
                />
                <Text style={styles.scoreValue}>
                  {Math.round(customer.riskScore * 100)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${customer.riskScore * 100}%`,
                      backgroundColor: getRiskColor(customer.riskScore),
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Trust Score</Text>
              <View style={styles.scoreRow}>
                <View style={[styles.scoreDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.scoreValue}>
                  {Math.round(customer.trustScore * 100)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${customer.trustScore * 100}%`, backgroundColor: '#22c55e' },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#64748b" />
              <Text style={styles.infoText}>{customer.phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <Text style={styles.infoText}>{customer.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#64748b" />
              <Text style={styles.infoText}>{customer.address}</Text>
            </View>
          </View>
        </View>

        {/* KYC Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>KYC Documents</Text>
          <View style={styles.infoCard}>
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>PAN Number</Text>
                <Text style={styles.docValue}>{customer.pan}</Text>
              </View>
              <View style={[styles.docStatus, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark" size={16} color="#22c55e" />
              </View>
            </View>
            <View style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>Aadhaar</Text>
                <Text style={styles.docValue}>{customer.aadhaar}</Text>
              </View>
              <View style={[styles.docStatus, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark" size={16} color="#22c55e" />
              </View>
            </View>
          </View>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products ({customer.products.length})</Text>
          {customer.products.map((product, index) => (
            <TouchableOpacity key={index} style={styles.productCard}>
              <View style={styles.productIcon}>
                <Ionicons
                  name={
                    product.type.includes('Savings')
                      ? 'wallet'
                      : product.type.includes('Loan')
                      ? 'home'
                      : 'card'
                  }
                  size={24}
                  color="#3b82f6"
                />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productType}>{product.type}</Text>
                <Text style={styles.productId}>{product.id}</Text>
              </View>
              <View style={styles.productBalance}>
                <Text style={styles.balanceValue}>{product.balance}</Text>
                <View style={styles.statusActive}>
                  <Text style={styles.statusActiveText}>Active</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {customer.recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: activity.color + '15' }]}>
                  <Ionicons name={activity.icon as any} size={18} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityType}>{activity.type}</Text>
                  <Text style={styles.activityDate}>{activity.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.quickActionText}>Update KYC</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: '#22c55e' }]}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.quickActionText}>New Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactButton: {
    alignItems: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  scoreCards: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scoreDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docInfo: {},
  docLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  docValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },
  docStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  productId: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  productBalance: {
    alignItems: 'flex-end',
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusActive: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  statusActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    marginLeft: 12,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  activityDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 12,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
