import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../src/context/store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Capability {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradient: [string, string];
  features: string[];
  category: string;
}

const capabilities: Capability[] = [
  {
    id: 'ai-agent',
    title: 'AI Agent Framework',
    description: 'Swayam-powered autonomous agents with 43+ tools for logistics, compliance & operations',
    icon: 'hardware-chip',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#6366f1'],
    category: 'AI & Intelligence',
    features: [
      'Autonomous task execution',
      '43+ specialized tools',
      'Multi-modal reasoning',
      'Real-time learning',
    ],
  },
  {
    id: 'knowledge-graph',
    title: 'Knowledge Graph',
    description: 'Interactive visualization of connected documents, topics, and relationships',
    icon: 'git-network',
    color: '#06b6d4',
    gradient: ['#06b6d4', '#0891b2'],
    category: 'Data Intelligence',
    features: [
      'D3.js visualization',
      'Bidirectional linking',
      'Topic extraction',
      'Smart search',
    ],
  },
  {
    id: 'logistics',
    title: 'Logistics Platform',
    description: 'Complete TMS with real-time tracking, compliance, and fleet management',
    icon: 'car',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
    category: 'Operations',
    features: [
      'Real-time GPS tracking',
      'E-way bill automation',
      'Fleet management',
      'Driver app',
    ],
  },
  {
    id: 'compliance',
    title: 'ComplyMitra',
    description: 'AI-powered compliance management for GST, IT, MCA & labor laws',
    icon: 'shield-checkmark',
    color: '#22c55e',
    gradient: ['#22c55e', '#16a34a'],
    category: 'Compliance',
    features: [
      'GST automation',
      'Deadline tracking',
      'Document management',
      'Risk assessment',
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics Engine',
    description: 'Real-time business intelligence with predictive analytics and custom dashboards',
    icon: 'analytics',
    color: '#ef4444',
    gradient: ['#ef4444', '#dc2626'],
    category: 'Analytics',
    features: [
      'Custom dashboards',
      'Predictive models',
      'Real-time metrics',
      'Export reports',
    ],
  },
  {
    id: 'integrations',
    title: 'Integration Hub',
    description: '43+ pre-built integrations with payment gateways, ERPs, and APIs',
    icon: 'extension-puzzle',
    color: '#3b82f6',
    gradient: ['#3b82f6', '#2563eb'],
    category: 'Platform',
    features: [
      'UPI & payments',
      'WhatsApp & Telegram',
      'ULIP & Fastag',
      'Custom webhooks',
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile Apps',
    description: 'Cross-platform apps for customers, staff, and drivers with offline support',
    icon: 'phone-portrait',
    color: '#ec4899',
    gradient: ['#ec4899', '#db2777'],
    category: 'Platform',
    features: [
      'iOS & Android',
      'Offline mode',
      'Push notifications',
      'Biometric auth',
    ],
  },
  {
    id: 'security',
    title: 'Security Suite',
    description: 'Enterprise-grade security with encryption, audit trails, and access control',
    icon: 'lock-closed',
    color: '#14b8a6',
    gradient: ['#14b8a6', '#0d9488'],
    category: 'Security',
    features: [
      'End-to-end encryption',
      'Role-based access',
      'Audit logging',
      'SOC2 compliant',
    ],
  },
];

const categories = [...new Set(capabilities.map((c) => c.category))];

export default function CapabilitiesScreen() {
  const { settings } = useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCapability, setExpandedCapability] = useState<string | null>(null);

  const filteredCapabilities = selectedCategory
    ? capabilities.filter((c) => c.category === selectedCategory)
    : capabilities;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="rocket" size={48} color="#fff" />
        <Text style={styles.headerTitle}>Platform Capabilities</Text>
        <Text style={styles.headerSubtitle}>
          Comprehensive suite of tools and services powering modern businesses
        </Text>
      </LinearGradient>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: theme.surface }, shadows.sm]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.primary }]}>8+</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Core Modules</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.primary }]}>43+</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tools</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.primary }]}>21</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Packages</Text>
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && { backgroundColor: theme.primary },
            selectedCategory && { borderColor: theme.border },
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.categoryText,
              { color: !selectedCategory ? '#fff' : theme.textSecondary },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && { backgroundColor: theme.primary },
              selectedCategory !== category && { borderColor: theme.border },
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === category ? '#fff' : theme.textSecondary },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Capabilities Grid */}
      <View style={styles.capabilitiesContainer}>
        {filteredCapabilities.map((capability) => (
          <TouchableOpacity
            key={capability.id}
            style={[styles.capabilityCard, { backgroundColor: theme.surface }, shadows.md]}
            onPress={() =>
              setExpandedCapability(
                expandedCapability === capability.id ? null : capability.id
              )
            }
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={capability.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.capabilityGradient}
            >
              <Ionicons name={capability.icon as any} size={32} color="#fff" />
            </LinearGradient>

            <View style={styles.capabilityContent}>
              <Text style={[styles.capabilityTitle, { color: theme.text }]}>
                {capability.title}
              </Text>
              <Text style={[styles.capabilityCategory, { color: capability.color }]}>
                {capability.category}
              </Text>
              <Text
                style={[styles.capabilityDescription, { color: theme.textSecondary }]}
                numberOfLines={expandedCapability === capability.id ? undefined : 2}
              >
                {capability.description}
              </Text>

              {expandedCapability === capability.id && (
                <View style={styles.featuresContainer}>
                  <Text style={[styles.featuresTitle, { color: theme.text }]}>Key Features:</Text>
                  {capability.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={capability.color} />
                      <Text style={[styles.featureText, { color: theme.textSecondary }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Ionicons
              name={expandedCapability === capability.id ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <LinearGradient
          colors={['#8b5cf6', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaCard}
        >
          <Ionicons name="document-text" size={32} color="#fff" />
          <Text style={styles.ctaTitle}>Want to learn more?</Text>
          <Text style={styles.ctaSubtitle}>
            Explore our complete documentation and API reference
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>View Documentation</Text>
            <Ionicons name="arrow-forward" size={18} color="#8b5cf6" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          © 2026 ANKR Technologies | All rights reserved
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    ...typography.h2,
    color: '#fff',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: -24,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  categoryScroll: {
    marginTop: spacing.lg,
  },
  categoryContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryText: {
    ...typography.label,
  },
  capabilitiesContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  capabilityCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  capabilityGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capabilityContent: {
    flex: 1,
  },
  capabilityTitle: {
    ...typography.h4,
    marginBottom: 2,
  },
  capabilityCategory: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  capabilityDescription: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  featuresContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  featuresTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.bodySmall,
  },
  ctaSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  ctaCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    ...typography.h3,
    color: '#fff',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  ctaSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  ctaButtonText: {
    ...typography.label,
    color: '#8b5cf6',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.caption,
  },
});
