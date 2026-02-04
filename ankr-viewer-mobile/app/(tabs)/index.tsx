import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useAppStore } from '../../src/context/store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/utils/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { settings, recentFiles, bookmarks } = useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const quickActions = [
    { icon: 'folder-open-outline', label: 'Browse Files', route: '/(tabs)/files', color: theme.primary },
    { icon: 'search-outline', label: 'Search', route: '/search', color: theme.accent },
    { icon: 'git-network-outline', label: 'Knowledge Graph', route: '/(tabs)/graph', color: theme.secondary },
    { icon: 'rocket-outline', label: 'Capabilities', route: '/(tabs)/capabilities', color: theme.success },
  ];

  const stats = [
    { label: 'Documents', value: '171+', icon: 'document-text-outline' },
    { label: 'Packages', value: '21', icon: 'cube-outline' },
    { label: 'Topics', value: '18', icon: 'pricetag-outline' },
    { label: 'Integrations', value: '43', icon: 'extension-puzzle-outline' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      {/* Hero Section */}
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoLetter}>A</Text>
          </View>
          <Text style={styles.heroTitle}>ANKR Viewer</Text>
          <Text style={styles.heroSubtitle}>
            Your complete knowledge browser and documentation platform
          </Text>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionCard, { backgroundColor: theme.surface }, shadows.sm]}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Platform Overview</Text>
        <View style={[styles.statsContainer, { backgroundColor: theme.surface }, shadows.sm]}>
          {stats.map((stat, index) => (
            <View
              key={stat.label}
              style={[
                styles.statItem,
                index < stats.length - 1 && { borderRightColor: theme.border, borderRightWidth: 1 },
              ]}
            >
              <Ionicons name={stat.icon as any} size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Files</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/files')}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.listContainer, { backgroundColor: theme.surface }]}>
            {recentFiles.slice(0, 5).map((file, index) => (
              <TouchableOpacity
                key={file.path}
                style={[
                  styles.listItem,
                  index < recentFiles.slice(0, 5).length - 1 && {
                    borderBottomColor: theme.border,
                    borderBottomWidth: 1,
                  },
                ]}
                onPress={() => router.push(`/viewer/${encodeURIComponent(file.path)}`)}
              >
                <Ionicons name="document-text-outline" size={20} color={theme.textSecondary} />
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: theme.text }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={[styles.listItemSubtitle, { color: theme.textMuted }]}>
                    {file.accessedAt}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Bookmarks */}
      {bookmarks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Bookmarks</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: theme.primary }]}>Manage</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.bookmarksRow}>
              {bookmarks.map((bookmark) => (
                <TouchableOpacity
                  key={bookmark.path}
                  style={[styles.bookmarkCard, { backgroundColor: theme.surface }, shadows.sm]}
                  onPress={() => router.push(`/viewer/${encodeURIComponent(bookmark.path)}`)}
                >
                  <Ionicons name="bookmark" size={24} color={theme.accent} />
                  <Text style={[styles.bookmarkTitle, { color: theme.text }]} numberOfLines={2}>
                    {bookmark.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Investor CTA */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.ctaCard, shadows.md]}
          onPress={() => router.push('/(tabs)/investor')}
        >
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <View style={styles.ctaContent}>
              <Ionicons name="briefcase-outline" size={32} color="#fff" />
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle}>Investor Dashboard</Text>
                <Text style={styles.ctaSubtitle}>View complete platform overview and metrics</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          ANKR Technologies © 2026
        </Text>
        <Text style={[styles.footerVersion, { color: theme.textMuted }]}>
          Version 1.0.0 | Made in India
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
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  heroTitle: {
    ...typography.h1,
    color: '#fff',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  seeAll: {
    ...typography.label,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionLabel: {
    ...typography.label,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statValue: {
    ...typography.h3,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
  },
  listContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    ...typography.body,
  },
  listItemSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  bookmarksRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bookmarkCard: {
    width: 120,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  bookmarkTitle: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  ctaCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  ctaGradient: {
    padding: spacing.lg,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    ...typography.h4,
    color: '#fff',
  },
  ctaSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  footerText: {
    ...typography.caption,
  },
  footerVersion: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
