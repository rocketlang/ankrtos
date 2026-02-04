import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../../src/context/store';
import { api } from '../../src/services/api';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ViewerScreen() {
  const { path } = useLocalSearchParams<{ path: string }>();
  const router = useRouter();
  const { settings, bookmarks, addBookmark, removeBookmark, addRecentFile } = useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];
  const [showActions, setShowActions] = useState(false);

  const decodedPath = decodeURIComponent(path || '');
  const fileName = decodedPath.split('/').pop() || 'Document';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  const isBookmarked = bookmarks.some((b) => b.path === decodedPath);

  const { data, isLoading, error } = useQuery({
    queryKey: ['file', decodedPath],
    queryFn: () => api.getFileContent(decodedPath),
    enabled: !!decodedPath,
  });

  useEffect(() => {
    if (decodedPath && fileName) {
      addRecentFile({
        path: decodedPath,
        name: fileName,
        accessedAt: new Date().toISOString(),
      });
    }
  }, [decodedPath, fileName]);

  const handleBookmark = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isBookmarked) {
      removeBookmark(decodedPath);
    } else {
      addBookmark({
        path: decodedPath,
        name: fileName,
        addedAt: new Date().toISOString(),
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: fileName,
        message: `Check out this document: ${fileName}\n\nhttps://ankr.in/viewer/${encodeURIComponent(decodedPath)}`,
        url: `https://ankr.in/viewer/${encodeURIComponent(decodedPath)}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(`https://ankr.in/viewer/${encodeURIComponent(decodedPath)}`);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const markdownStyles = {
    body: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '700',
      marginTop: 24,
      marginBottom: 12,
    },
    heading2: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '600',
      marginTop: 20,
      marginBottom: 10,
    },
    heading3: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    heading4: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '500',
      marginTop: 12,
      marginBottom: 6,
    },
    paragraph: {
      color: theme.text,
      marginVertical: 8,
    },
    code_inline: {
      backgroundColor: theme.surfaceElevated,
      color: theme.accent,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
    },
    code_block: {
      backgroundColor: theme.surfaceElevated,
      color: theme.text,
      padding: 16,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 14,
      marginVertical: 12,
    },
    fence: {
      backgroundColor: theme.surfaceElevated,
      color: theme.text,
      padding: 16,
      borderRadius: 8,
      fontFamily: 'monospace',
      fontSize: 14,
      marginVertical: 12,
    },
    blockquote: {
      backgroundColor: theme.surfaceElevated,
      borderLeftColor: theme.primary,
      borderLeftWidth: 4,
      paddingLeft: 16,
      paddingVertical: 8,
      marginVertical: 12,
    },
    link: {
      color: theme.primary,
    },
    list_item: {
      color: theme.text,
      marginVertical: 4,
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    table: {
      borderColor: theme.border,
    },
    tr: {
      borderBottomColor: theme.border,
    },
    th: {
      backgroundColor: theme.surfaceElevated,
      color: theme.text,
      padding: 8,
    },
    td: {
      color: theme.text,
      padding: 8,
    },
    hr: {
      backgroundColor: theme.border,
      marginVertical: 16,
    },
    image: {
      borderRadius: 8,
    },
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading document...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.error} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Failed to load document</Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const content = data?.content || '';
    const fileType = data?.type || fileExtension;

    // Markdown files
    if (['md', 'markdown', 'mdx'].includes(fileType)) {
      return (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.markdownContainer}
          showsVerticalScrollIndicator={false}
        >
          {data?.frontmatter && Object.keys(data.frontmatter).length > 0 && (
            <View style={[styles.frontmatter, { backgroundColor: theme.surfaceElevated }]}>
              {Object.entries(data.frontmatter).map(([key, value]) => (
                <View key={key} style={styles.frontmatterItem}>
                  <Text style={[styles.frontmatterKey, { color: theme.textMuted }]}>{key}:</Text>
                  <Text style={[styles.frontmatterValue, { color: theme.text }]}>
                    {String(value)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Markdown style={markdownStyles}>{content}</Markdown>
        </ScrollView>
      );
    }

    // Code files
    if (['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'yaml', 'yml', 'toml', 'sh', 'bash'].includes(fileType)) {
      return (
        <ScrollView
          style={styles.contentScroll}
          horizontal
          showsHorizontalScrollIndicator
        >
          <ScrollView showsVerticalScrollIndicator>
            <View style={[styles.codeContainer, { backgroundColor: theme.surfaceElevated }]}>
              <Text style={[styles.codeText, { color: theme.text }]}>{content}</Text>
            </View>
          </ScrollView>
        </ScrollView>
      );
    }

    // PDF files
    if (fileType === 'pdf') {
      return (
        <WebView
          source={{ uri: `https://ankr.in/api/file/raw?path=${encodeURIComponent(decodedPath)}` }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          )}
        />
      );
    }

    // HTML files
    if (fileType === 'html') {
      return (
        <WebView
          source={{ html: content }}
          style={styles.webview}
          startInLoadingState
        />
      );
    }

    // Image files
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(fileType)) {
      return (
        <WebView
          source={{ uri: `https://ankr.in/api/file/raw?path=${encodeURIComponent(decodedPath)}` }}
          style={styles.webview}
          startInLoadingState
        />
      );
    }

    // Default: Plain text
    return (
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.textContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.plainText, { color: theme.text }]}>{content}</Text>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: fileName,
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleBookmark} style={styles.headerButton}>
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={isBookmarked ? theme.warning : theme.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowActions(!showActions)} style={styles.headerButton}>
                <Ionicons name="ellipsis-vertical" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Action Sheet */}
      {showActions && (
        <View style={[styles.actionSheet, { backgroundColor: theme.surface }, shadows.lg]}>
          <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={theme.text} />
            <Text style={[styles.actionText, { color: theme.text }]}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={handleCopyLink}>
            <Ionicons name="link-outline" size={22} color={theme.text} />
            <Text style={[styles.actionText, { color: theme.text }]}>Copy Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={handleBookmark}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={theme.text}
            />
            <Text style={[styles.actionText, { color: theme.text }]}>
              {isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* File Info Bar */}
      <View style={[styles.fileInfo, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.fileInfoLeft}>
          <Ionicons name="document-text-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.fileInfoText, { color: theme.textMuted }]} numberOfLines={1}>
            {decodedPath}
          </Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: theme.surfaceElevated }]}>
          <Text style={[styles.typeText, { color: theme.textSecondary }]}>
            {fileExtension.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: spacing.sm,
  },
  actionSheet: {
    position: 'absolute',
    top: 0,
    right: spacing.md,
    zIndex: 100,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    minWidth: 180,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  actionText: {
    ...typography.body,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  fileInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  fileInfoText: {
    ...typography.caption,
    flex: 1,
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    ...typography.caption,
    fontWeight: '600',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h4,
    marginTop: spacing.lg,
  },
  errorMessage: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    ...typography.label,
    color: '#fff',
  },
  contentScroll: {
    flex: 1,
  },
  markdownContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  frontmatter: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  frontmatterItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  frontmatterKey: {
    ...typography.caption,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  frontmatterValue: {
    ...typography.caption,
    flex: 1,
  },
  codeContainer: {
    padding: spacing.lg,
    minWidth: SCREEN_WIDTH,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22,
  },
  textContainer: {
    padding: spacing.lg,
  },
  plainText: {
    ...typography.body,
    lineHeight: 24,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
