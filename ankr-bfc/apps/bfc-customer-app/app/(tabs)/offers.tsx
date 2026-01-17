/**
 * Offers Screen - BFC Customer App
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const offers = [
  {
    id: '1',
    type: 'PERSONAL_LOAN',
    title: 'Pre-approved Personal Loan',
    description: 'Get instant funds for your needs',
    amount: '₹10,00,000',
    rate: '10.5% p.a.',
    confidence: 92,
    color: '#8b5cf6',
    icon: 'cash',
  },
  {
    id: '2',
    type: 'CREDIT_CARD',
    title: 'Platinum Credit Card',
    description: 'Premium benefits & rewards',
    amount: '₹3,00,000 limit',
    rate: '2X Rewards',
    confidence: 88,
    color: '#f59e0b',
    icon: 'card',
  },
  {
    id: '3',
    type: 'INSURANCE',
    title: 'Term Life Insurance',
    description: 'Secure your family\'s future',
    amount: '₹1 Cr cover',
    rate: '₹599/month',
    confidence: 78,
    color: '#22c55e',
    icon: 'shield-checkmark',
  },
  {
    id: '4',
    type: 'FD',
    title: 'Special FD Rate',
    description: 'Limited time offer',
    amount: 'Min ₹10,000',
    rate: '7.5% p.a.',
    confidence: 85,
    color: '#3b82f6',
    icon: 'trending-up',
  },
];

export default function OffersScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personalized for you</Text>
        <Text style={styles.headerSubtitle}>Based on your profile and activity</Text>
      </View>

      <View style={styles.offersGrid}>
        {offers.map((offer) => (
          <Link key={offer.id} href={`/offer/${offer.id}`} asChild>
            <TouchableOpacity style={styles.offerCard}>
              <View style={[styles.offerIcon, { backgroundColor: offer.color + '15' }]}>
                <Ionicons name={offer.icon as any} size={28} color={offer.color} />
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{offer.confidence}% match</Text>
              </View>
              <Text style={styles.offerType}>{offer.type.replace('_', ' ')}</Text>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDesc}>{offer.description}</Text>
              <View style={styles.offerDetails}>
                <View>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>{offer.amount}</Text>
                </View>
                <View style={styles.detailRight}>
                  <Text style={styles.detailLabel}>Rate</Text>
                  <Text style={[styles.detailValue, { color: offer.color }]}>{offer.rate}</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.applyButton, { backgroundColor: offer.color }]}>
                <Text style={styles.applyText}>Apply Now</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          </Link>
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
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  offersGrid: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  offerType: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  offerDesc: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  offerDetails: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },
  detailRight: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
