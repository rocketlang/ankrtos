import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../src/context/store';
import { api } from '../../src/services/api';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/utils/theme';
import { SearchResult } from '../../src/types';

const suggestedSearches = [
  { query: 'API documentation', icon: 'code-slash' },
  { query: 'Compliance guide', icon: 'shield-checkmark' },
  { query: 'Integration setup', icon: 'git-merge' },
  { query: 'Getting started', icon: 'rocket' },
  { query: 'Swayam tools', icon: 'hardware-chip' },
  { query: 'WowTruck TMS', icon: 'car' },
];

const documentCategories = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'docs', label: 'Docs', icon: 'document-text' },
  { id: 'api', label: 'API', icon: 'code-slash' },
  { id: 'guides', label: 'Guides', icon: 'book' },
  { id: 'packages', label: 'Packages', icon: 'cube' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { settings, addRecentFile } = useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const {
    data: results = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['search', query, selectedCategory],
    queryFn: () => api.search(query, selectedCategory !== 'all' ? selectedCategory : undefined),
    enabled: query.length >= 2,
    staleTime: 30000,
  });

  const handleSearch = useCallback(() => {
    if (query.length >= 2) {
      Keyboard.dismiss();
      refetch();
    }
  }, [query, refetch]);

  const handleResultPress = useCallback(
    (result: SearchResult) => {
      addRecentFile({
        path: result.path,
        name: result.name,
        accessedAt: new Date().toISOString(),
      });
      router.push(`/viewer/${encodeURIComponent(result.path)}`);
    },
    [router, addRecentFile]
  );

  const handleSuggestedSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  const getTypeIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      markdown: 'document-text',
      pdf: 'document',
      code: 'code-slash',
      json: 'code',
      image: 'image',
      default: 'document-outline',
    };
    return iconMap[type] || iconMap.default;
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.resultCard, { backgroundColor: theme.surface }, shadows.sm]}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.resultIcon, { backgroundColor: `${theme.primary}20` }]}>
        <Ionicons name={getTypeIcon(item.type) as any} size={24} color={theme.primary} />
      </View>
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.resultPath, { color: theme.textMuted }]} numberOfLines={1}>
          {item.path}
        </Text>
        {item.snippet && (
          <Text style={[styles.resultSnippet, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.snippet}
          </Text>
        )}
      </View>
      <View style={styles.resultMeta}>
        <View style={[styles.scoreBadge, { backgroundColor: theme.surfaceElevated }]}>
          <Text style={[styles.scoreText, { color: theme.textSecondary }]}>
            {Math.round(item.score * 100)}%
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Header */}
      <View style={[styles.searchHeader, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.background }]}>
          <Ionicons name="search" size={20} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search documents, APIs, guides..."
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <FlatList
          horizontal
          data={documentCategories}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && { backgroundColor: theme.primary },
                selectedCategory !== item.id && { borderColor: theme.border },
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Ionicons
                name={item.icon as any}
                size={14}
                color={selectedCategory === item.id ? '#fff' : theme.textSecondary}
              />
              <Text
                style={[
                  styles.categoryText,
                  { color: selectedCategory === item.id ? '#fff' : theme.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Content */}
      {query.length < 2 ? (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: theme.text }]}>Suggested Searches</Text>
          <View style={styles.suggestionsGrid}>
            {suggestedSearches.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.query}
                style={[styles.suggestionCard, { backgroundColor: theme.surface }, shadows.sm]}
                onPress={() => handleSuggestedSearch(suggestion.query)}
              >
                <Ionicons name={suggestion.icon as any} size={24} color={theme.primary} />
                <Text style={[styles.suggestionText, { color: theme.text }]} numberOfLines={2}>
                  {suggestion.query}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Links */}
          <Text style={[styles.suggestionsTitle, { color: theme.text, marginTop: spacing.xl }]}>
            Browse by Type
          </Text>
          <View style={[styles.quickLinksCard, { backgroundColor: theme.surface }, shadows.sm]}>
            {[
              { icon: 'document-text', label: 'Documentation', count: '171+' },
              { icon: 'cube', label: 'Packages', count: '21' },
              { icon: 'extension-puzzle', label: 'Integrations', count: '43+' },
              { icon: 'git-network', label: 'Knowledge Graph', count: '18 topics' },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.quickLinkItem,
                  index < 3 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}
                onPress={() => router.push('/(tabs)/files')}
              >
                <Ionicons name={item.icon as any} size={22} color={theme.primary} />
                <Text style={[styles.quickLinkLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={[styles.quickLinkCount, { color: theme.textMuted }]}>{item.count}</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.path}
          renderItem={renderResult}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    height: 48,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
  },
  categoryList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  categoryText: {
    ...typography.caption,
    fontWeight: '500',
  },
  suggestionsContainer: {
    padding: spacing.lg,
  },
  suggestionsTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  suggestionCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  suggestionText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  quickLinksCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  quickLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  quickLinkLabel: {
    ...typography.body,
    flex: 1,
  },
  quickLinkCount: {
    ...typography.caption,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  resultsList: {
    padding: spacing.md,
  },
  resultsCount: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  resultCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  resultPath: {
    ...typography.caption,
    marginTop: 2,
  },
  resultSnippet: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  resultMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  scoreBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  scoreText: {
    ...typography.caption,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h4,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    ...typography.body,
    marginTop: spacing.sm,
  },
});
