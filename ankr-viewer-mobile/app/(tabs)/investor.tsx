import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useAppStore } from '../../src/context/store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'live' | 'beta' | 'development';
  icon: string;
  color: string;
  metrics: { label: string; value: string }[];
  links: { label: string; url: string }[];
}

const projects: Project[] = [
  {
    id: 'wowtruck',
    name: 'WowTruck TMS',
    description: 'Complete Transportation Management System with real-time tracking and compliance',
    status: 'live',
    icon: 'car',
    color: '#f59e0b',
    metrics: [
      { label: 'Active Trips', value: '500+' },
      { label: 'Fleet Size', value: '1200+' },
      { label: 'Cities', value: '150+' },
    ],
    links: [
      { label: 'Web App', url: 'https://wowtruck.in' },
      { label: 'Documentation', url: 'https://ankr.in/viewer/wowtruck' },
    ],
  },
  {
    id: 'complymitra',
    name: 'ComplyMitra',
    description: 'AI-powered compliance management for Indian businesses - GST, IT, MCA & more',
    status: 'live',
    icon: 'shield-checkmark',
    color: '#22c55e',
    metrics: [
      { label: 'Clients', value: '200+' },
      { label: 'Compliance Rules', value: '1500+' },
      { label: 'Automation', value: '85%' },
    ],
    links: [
      { label: 'Landing Page', url: 'https://complymitra.in' },
      { label: 'Documentation', url: 'https://ankr.in/viewer/complymitra' },
    ],
  },
  {
    id: 'bfc',
    name: 'BFC Platform',
    description: 'Banking, Finance & Credit platform with telematics-based insurance',
    status: 'beta',
    icon: 'card',
    color: '#3b82f6',
    metrics: [
      { label: 'APIs', value: '50+' },
      { label: 'Insurance Products', value: '12' },
      { label: 'Integration Time', value: '< 1 week' },
    ],
    links: [
      { label: 'Demo', url: 'https://bfc.ankr.in' },
      { label: 'Documentation', url: 'https://ankr.in/viewer/bfc' },
    ],
  },
  {
    id: 'swayam',
    name: 'Swayam AI Agent',
    description: 'Autonomous AI agent with 43+ tools for logistics, compliance & operations',
    status: 'live',
    icon: 'hardware-chip',
    color: '#8b5cf6',
    metrics: [
      { label: 'Tools', value: '43+' },
      { label: 'Tasks/Day', value: '10K+' },
      { label: 'Accuracy', value: '94%' },
    ],
    links: [
      { label: 'Try Demo', url: 'https://swayam.ankr.in' },
      { label: 'Documentation', url: 'https://ankr.in/viewer/swayam' },
    ],
  },
  {
    id: 'eon',
    name: 'EON Infrastructure',
    description: 'Backend infrastructure with hybrid search, vector DB, and event streaming',
    status: 'live',
    icon: 'server',
    color: '#06b6d4',
    metrics: [
      { label: 'Uptime', value: '99.9%' },
      { label: 'Latency', value: '< 50ms' },
      { label: 'Events/sec', value: '10K+' },
    ],
    links: [
      { label: 'Status', url: 'https://status.ankr.in' },
      { label: 'Documentation', url: 'https://ankr.in/viewer/eon' },
    ],
  },
  {
    id: 'ankr-packages',
    name: 'ANKR Packages',
    description: '21 standalone NPM packages extracted from monorepo for enterprise use',
    status: 'live',
    icon: 'cube',
    color: '#ec4899',
    metrics: [
      { label: 'Packages', value: '21' },
      { label: 'Downloads', value: '5K+' },
      { label: 'Stars', value: '150+' },
    ],
    links: [
      { label: 'NPM Registry', url: 'https://npm.ankr.in' },
      { label: 'Documentation', url: 'https://ankr.in/viewer/packages' },
    ],
  },
];

const investorHighlights = [
  { icon: 'trending-up', label: 'Revenue Growth', value: '180% YoY', color: '#22c55e' },
  { icon: 'people', label: 'Team Size', value: '25+', color: '#3b82f6' },
  { icon: 'business', label: 'Enterprise Clients', value: '50+', color: '#8b5cf6' },
  { icon: 'globe', label: 'Cities Covered', value: '150+', color: '#f59e0b' },
];

const techStack = [
  { name: 'React Native', category: 'Mobile' },
  { name: 'TypeScript', category: 'Language' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'Redis', category: 'Cache' },
  { name: 'Kubernetes', category: 'Infra' },
  { name: 'OpenAI', category: 'AI' },
  { name: 'D3.js', category: 'Viz' },
];

export default function InvestorScreen() {
  const { settings } = useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'ANKR Technologies - Investor Deck',
        message:
          'Check out ANKR Technologies - Building the future of logistics and compliance automation in India.\n\nView our complete platform: https://ankr.in/viewer/',
        url: 'https://ankr.in/viewer/',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#22c55e';
      case 'beta':
        return '#f59e0b';
      case 'development':
        return '#3b82f6';
      default:
        return theme.textMuted;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={['#1e1b4b', '#312e81', '#4338ca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <Text style={styles.heroTitle}>ANKR Technologies</Text>
          <Text style={styles.heroTagline}>
            Building India's Logistics & Compliance Infrastructure
          </Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.shareButtonText}>Share Deck</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Key Highlights */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Highlights</Text>
        <View style={styles.highlightsGrid}>
          {investorHighlights.map((highlight) => (
            <View
              key={highlight.label}
              style={[styles.highlightCard, { backgroundColor: theme.surface }, shadows.sm]}
            >
              <View style={[styles.highlightIcon, { backgroundColor: `${highlight.color}20` }]}>
                <Ionicons name={highlight.icon as any} size={24} color={highlight.color} />
              </View>
              <Text style={[styles.highlightValue, { color: theme.text }]}>{highlight.value}</Text>
              <Text style={[styles.highlightLabel, { color: theme.textSecondary }]}>
                {highlight.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Products Portfolio */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Product Portfolio</Text>
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={[styles.projectCard, { backgroundColor: theme.surface }, shadows.md]}
            onPress={() =>
              setExpandedProject(expandedProject === project.id ? null : project.id)
            }
            activeOpacity={0.8}
          >
            <View style={styles.projectHeader}>
              <View style={[styles.projectIcon, { backgroundColor: `${project.color}20` }]}>
                <Ionicons name={project.icon as any} size={28} color={project.color} />
              </View>
              <View style={styles.projectInfo}>
                <View style={styles.projectTitleRow}>
                  <Text style={[styles.projectName, { color: theme.text }]}>{project.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(project.status)}20` },
                    ]}
                  >
                    <View
                      style={[styles.statusDot, { backgroundColor: getStatusColor(project.status) }]}
                    />
                    <Text
                      style={[styles.statusText, { color: getStatusColor(project.status) }]}
                    >
                      {project.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[styles.projectDescription, { color: theme.textSecondary }]}
                  numberOfLines={expandedProject === project.id ? undefined : 2}
                >
                  {project.description}
                </Text>
              </View>
              <Ionicons
                name={expandedProject === project.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.textMuted}
              />
            </View>

            {expandedProject === project.id && (
              <View style={styles.projectExpanded}>
                <View style={styles.metricsRow}>
                  {project.metrics.map((metric, index) => (
                    <View
                      key={index}
                      style={[
                        styles.metricItem,
                        index < project.metrics.length - 1 && {
                          borderRightWidth: 1,
                          borderRightColor: theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.metricValue, { color: project.color }]}>
                        {metric.value}
                      </Text>
                      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
                        {metric.label}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.linksRow}>
                  {project.links.map((link) => (
                    <TouchableOpacity
                      key={link.label}
                      style={[styles.linkButton, { borderColor: project.color }]}
                      onPress={() => handleOpenLink(link.url)}
                    >
                      <Text style={[styles.linkButtonText, { color: project.color }]}>
                        {link.label}
                      </Text>
                      <Ionicons name="open-outline" size={14} color={project.color} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tech Stack */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Technology Stack</Text>
        <View style={[styles.techStackCard, { backgroundColor: theme.surface }, shadows.sm]}>
          <View style={styles.techGrid}>
            {techStack.map((tech) => (
              <View key={tech.name} style={styles.techItem}>
                <Text style={[styles.techName, { color: theme.text }]}>{tech.name}</Text>
                <Text style={[styles.techCategory, { color: theme.textMuted }]}>
                  {tech.category}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Documentation CTA */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.docsCTA, shadows.lg]}
          onPress={() => handleOpenLink('https://ankr.in/viewer/')}
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.docsGradient}
          >
            <Ionicons name="book" size={32} color="#fff" />
            <View style={styles.docsContent}>
              <Text style={styles.docsTitle}>Complete Documentation</Text>
              <Text style={styles.docsSubtitle}>
                Access all technical docs, API references, and guides
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Contact Section */}
      <View style={styles.section}>
        <View style={[styles.contactCard, { backgroundColor: theme.surface }, shadows.sm]}>
          <Text style={[styles.contactTitle, { color: theme.text }]}>Get in Touch</Text>
          <Text style={[styles.contactSubtitle, { color: theme.textSecondary }]}>
            Interested in partnering or investing? Let's talk.
          </Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.primary }]}
              onPress={() => handleOpenLink('mailto:invest@ankr.in')}
            >
              <Ionicons name="mail" size={18} color="#fff" />
              <Text style={styles.contactButtonText}>invest@ankr.in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: '#25D366' }]}
              onPress={() => handleOpenLink('https://wa.me/919876543210')}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.contactButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          © 2026 ANKR Technologies Pvt. Ltd.
        </Text>
        <Text style={[styles.footerSubtext, { color: theme.textMuted }]}>
          Made with pride in India
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  heroTitle: {
    ...typography.h1,
    color: '#fff',
    marginBottom: spacing.sm,
  },
  heroTagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  shareButtonText: {
    ...typography.label,
    color: '#fff',
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  highlightCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  highlightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  highlightValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  highlightLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  projectCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  projectIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  projectName: {
    ...typography.h4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  projectDescription: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  projectExpanded: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  metricValue: {
    ...typography.h4,
    fontWeight: '700',
  },
  metricLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  linksRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  linkButtonText: {
    ...typography.label,
  },
  techStackCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  techItem: {
    width: (SCREEN_WIDTH - spacing.lg * 4 - spacing.md * 3) / 4,
    alignItems: 'center',
  },
  techName: {
    ...typography.label,
    fontSize: 12,
  },
  techCategory: {
    ...typography.caption,
    fontSize: 10,
  },
  docsCTA: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  docsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  docsContent: {
    flex: 1,
  },
  docsTitle: {
    ...typography.h4,
    color: '#fff',
  },
  docsSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  contactCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  contactTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  contactSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  contactButtonText: {
    ...typography.label,
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  footerText: {
    ...typography.bodySmall,
  },
  footerSubtext: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
