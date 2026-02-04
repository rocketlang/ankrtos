import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../src/context/store';
import { api } from '../../src/services/api';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/utils/theme';
import { FileItem } from '../../src/types';

const getFileIcon = (item: FileItem): string => {
  if (item.type === 'directory') return 'folder';
  const ext = item.extension?.toLowerCase() || '';
  const iconMap: Record<string, string> = {
    md: 'document-text',
    txt: 'document-text',
    pdf: 'document',
    doc: 'document',
    docx: 'document',
    xls: 'grid',
    xlsx: 'grid',
    csv: 'grid',
    json: 'code-slash',
    js: 'logo-javascript',
    ts: 'code',
    tsx: 'code',
    jsx: 'logo-react',
    py: 'logo-python',
    html: 'logo-html5',
    css: 'logo-css3',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    svg: 'image',
    mp4: 'videocam',
    mp3: 'musical-notes',
    zip: 'archive',
  };
  return iconMap[ext] || 'document-outline';
};

const getFileColor = (item: FileItem, theme: any): string => {
  if (item.type === 'directory') return theme.warning;
  const ext = item.extension?.toLowerCase() || '';
  const colorMap: Record<string, string> = {
    md: theme.success,
    pdf: theme.error,
    json: theme.accent,
    js: '#f7df1e',
    ts: '#3178c6',
    tsx: '#61dafb',
    py: '#3776ab',
    png: theme.secondary,
    jpg: theme.secondary,
  };
  return colorMap[ext] || theme.textSecondary;
};

export default function FilesScreen() {
  const router = useRouter();
  const { settings, currentPath, setCurrentPath, addRecentFile } = useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const {
    data: files = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['files', currentPath],
    queryFn: () => api.listFiles(currentPath),
    staleTime: 30000,
  });

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });

  const handleFilePress = useCallback(
    (item: FileItem) => {
      if (item.type === 'directory') {
        setCurrentPath(item.path);
      } else {
        addRecentFile({
          path: item.path,
          name: item.name,
          accessedAt: new Date().toISOString(),
        });
        router.push(`/viewer/${encodeURIComponent(item.path)}`);
      }
    },
    [router, setCurrentPath, addRecentFile]
  );

  const handleBack = useCallback(() => {
    if (currentPath) {
      const parts = currentPath.split('/');
      parts.pop();
      setCurrentPath(parts.join('/'));
    }
  }, [currentPath, setCurrentPath]);

  const breadcrumbs = currentPath ? ['Root', ...currentPath.split('/').filter(Boolean)] : ['Root'];

  const renderFileItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={[
        viewMode === 'list' ? styles.listItem : styles.gridItem,
        { backgroundColor: theme.surface },
        shadows.sm,
      ]}
      onPress={() => handleFilePress(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${getFileColor(item, theme)}20` },
          viewMode === 'grid' && styles.gridIconContainer,
        ]}
      >
        <Ionicons
          name={getFileIcon(item) as any}
          size={viewMode === 'list' ? 24 : 32}
          color={getFileColor(item, theme)}
        />
      </View>
      <View style={viewMode === 'list' ? styles.listContent : styles.gridContent}>
        <Text
          style={[styles.fileName, { color: theme.text }]}
          numberOfLines={viewMode === 'list' ? 1 : 2}
        >
          {item.name}
        </Text>
        {viewMode === 'list' && (
          <Text style={[styles.fileInfo, { color: theme.textMuted }]}>
            {item.type === 'directory' ? 'Folder' : item.extension?.toUpperCase() || 'File'}
            {item.size && ` • ${formatFileSize(item.size)}`}
          </Text>
        )}
      </View>
      {viewMode === 'list' && (
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.surface }]}>
          <Ionicons name="search" size={20} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search files..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.viewToggle, { backgroundColor: theme.surface }]}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
        >
          <Ionicons
            name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
            size={22}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Breadcrumbs */}
      <View style={styles.breadcrumbsContainer}>
        {currentPath && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={theme.primary} />
          </TouchableOpacity>
        )}
        <FlatList
          horizontal
          data={breadcrumbs}
          keyExtractor={(item, index) => `${item}-${index}`}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={styles.breadcrumbItem}>
              {index > 0 && (
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              )}
              <Text
                style={[
                  styles.breadcrumbText,
                  { color: index === breadcrumbs.length - 1 ? theme.primary : theme.textSecondary },
                ]}
              >
                {item}
              </Text>
            </View>
          )}
        />
      </View>

      {/* File List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading files...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedFiles}
          keyExtractor={(item) => item.path}
          renderItem={renderFileItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={[
            styles.listContainer,
            viewMode === 'grid' && styles.gridContainer,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery ? 'No files match your search' : 'This folder is empty'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
  },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadcrumbsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    ...typography.bodySmall,
    marginHorizontal: spacing.xs,
  },
  listContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  gridContainer: {
    gap: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  gridItem: {
    flex: 1,
    margin: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    maxWidth: '48%',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  listContent: {
    flex: 1,
  },
  gridContent: {
    alignItems: 'center',
  },
  fileName: {
    ...typography.body,
    fontWeight: '500',
  },
  fileInfo: {
    ...typography.caption,
    marginTop: 2,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
  },
});
