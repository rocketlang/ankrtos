/**
 * Offer Detail Screen - BFC Customer App
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const offerDetails = {
  '1': {
    type: 'PERSONAL_LOAN',
    title: 'Pre-approved Personal Loan',
    description: 'Get instant funds for your needs with minimal documentation',
    amount: '₹10,00,000',
    rate: '10.5% p.a.',
    tenure: '12-60 months',
    emi: '₹21,494',
    processingFee: '1% + GST',
    features: [
      'Instant approval',
      'Minimal documentation',
      'No collateral required',
      'Flexible tenure options',
      'Part payment allowed',
    ],
    color: '#8b5cf6',
    confidence: 92,
  },
};

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const offer = offerDetails[id as keyof typeof offerDetails] || offerDetails['1'];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: offer.color }]}>
          <View style={styles.headerContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{offer.confidence}% match for you</Text>
            </View>
            <Text style={styles.offerType}>{offer.type.replace('_', ' ')}</Text>
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.offerDesc}>{offer.description}</Text>
          </View>
        </View>

        {/* Key Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>{offer.amount}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Interest Rate</Text>
              <Text style={[styles.detailValue, { color: offer.color }]}>{offer.rate}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tenure</Text>
              <Text style={styles.detailValue}>{offer.tenure}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>EMI (60 months)</Text>
              <Text style={styles.detailValue}>{offer.emi}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Processing Fee</Text>
              <Text style={styles.detailValue}>{offer.processingFee}</Text>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          {offer.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Documents Required */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents Required</Text>
          <View style={styles.docList}>
            {['PAN Card', 'Aadhaar Card', 'Bank Statements (3 months)'].map((doc, index) => (
              <View key={index} style={styles.docItem}>
                <Ionicons name="document-text" size={18} color="#64748b" />
                <Text style={styles.docText}>{doc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={18} color="#94a3b8" />
          <Text style={styles.disclaimerText}>
            *Terms & conditions apply. Final approval subject to document verification.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Calculate EMI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: offer.color }]}>
          <Text style={styles.primaryText}>Apply Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  offerType: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  offerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  offerDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#475569',
  },
  docList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  docText: {
    fontSize: 14,
    color: '#475569',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
