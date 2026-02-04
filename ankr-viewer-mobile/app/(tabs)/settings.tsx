import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAppStore } from '../../src/context/store';
import { colors, spacing, borderRadius, typography, shadows } from '../../src/utils/theme';

export default function SettingsScreen() {
  const { settings, updateSettings, bookmarks, recentFiles, setBookmarks, setRecentFiles } =
    useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);

  const handleThemeChange = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updateSettings({ theme: nextTheme });
  };

  const handleSaveApiUrl = () => {
    updateSettings({ apiUrl });
    Alert.alert('Success', 'API URL updated successfully');
  };

  const handleClearData = () => {
    Alert.alert('Clear All Data', 'This will clear bookmarks and recent files. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setBookmarks([]);
          setRecentFiles([]);
          Alert.alert('Success', 'Data cleared successfully');
        },
      },
    ]);
  };

  const handleOpenLink = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const settingSections = [
    {
      title: 'Appearance',
      items: [
        {
          icon: 'color-palette-outline',
          label: 'Theme',
          value: settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1),
          onPress: handleThemeChange,
          type: 'button',
        },
      ],
    },
    {
      title: 'Connection',
      items: [
        {
          icon: 'cloud-outline',
          label: 'Offline Mode',
          value: settings.offlineMode,
          onPress: () => updateSettings({ offlineMode: !settings.offlineMode }),
          type: 'switch',
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Push Notifications',
          value: settings.notifications,
          onPress: () => updateSettings({ notifications: !settings.notifications }),
          type: 'switch',
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          icon: 'bookmark-outline',
          label: 'Bookmarks',
          value: `${bookmarks.length} saved`,
          type: 'info',
        },
        {
          icon: 'time-outline',
          label: 'Recent Files',
          value: `${recentFiles.length} items`,
          type: 'info',
        },
        {
          icon: 'trash-outline',
          label: 'Clear All Data',
          value: '',
          onPress: handleClearData,
          type: 'danger',
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'Version',
          value: '1.0.0',
          type: 'info',
        },
        {
          icon: 'globe-outline',
          label: 'Website',
          value: 'ankr.in',
          onPress: () => handleOpenLink('https://ankr.in'),
          type: 'link',
        },
        {
          icon: 'document-text-outline',
          label: 'Documentation',
          value: 'View Docs',
          onPress: () => handleOpenLink('https://ankr.in/viewer/'),
          type: 'link',
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Privacy Policy',
          value: '',
          onPress: () => handleOpenLink('https://ankr.in/privacy'),
          type: 'link',
        },
        {
          icon: 'document-outline',
          label: 'Terms of Service',
          value: '',
          onPress: () => handleOpenLink('https://ankr.in/terms'),
          type: 'link',
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* API URL Configuration */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>API Configuration</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }, shadows.sm]}>
          <View style={styles.inputRow}>
            <Ionicons name="server-outline" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              value={apiUrl}
              onChangeText={setApiUrl}
              placeholder="https://ankr.in"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSaveApiUrl}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{section.title}</Text>
          <View style={[styles.card, { backgroundColor: theme.surface }, shadows.sm]}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.settingItem,
                  index < section.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
                onPress={item.onPress}
                disabled={item.type === 'info' || item.type === 'switch'}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.type === 'danger' ? theme.error : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: item.type === 'danger' ? theme.error : theme.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                <View style={styles.settingRight}>
                  {item.type === 'switch' ? (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={item.onPress}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor="#fff"
                    />
                  ) : item.type === 'button' || item.type === 'info' || item.type === 'link' ? (
                    <>
                      <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                        {item.value}
                      </Text>
                      {(item.type === 'button' || item.type === 'link') && (
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                      )}
                    </>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
          <Text style={styles.logoText}>A</Text>
        </View>
        <Text style={[styles.footerTitle, { color: theme.text }]}>ANKR Viewer</Text>
        <Text style={[styles.footerSubtitle, { color: theme.textMuted }]}>
          Knowledge Browser for Modern Teams
        </Text>
        <Text style={[styles.copyright, { color: theme.textMuted }]}>
          © 2026 ANKR Technologies Pvt. Ltd.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  saveButton: {
    margin: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.label,
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: {
    ...typography.body,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingValue: {
    ...typography.bodySmall,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  footerTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  footerSubtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
  },
  copyright: {
    ...typography.caption,
  },
});
