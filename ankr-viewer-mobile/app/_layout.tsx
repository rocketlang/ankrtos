import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { colors, spacing, typography } from '../src/utils/theme';
import { useAppStore } from '../src/context/store';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function CustomDrawerContent({ navigation }: { navigation: any }) {
  const { bookmarks, recentFiles, settings } = useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];

  const menuItems = [
    { icon: 'home-outline', label: 'Home', route: '(tabs)' },
    { icon: 'folder-outline', label: 'Files', route: '(tabs)/files' },
    { icon: 'git-network-outline', label: 'Knowledge Graph', route: '(tabs)/graph' },
    { icon: 'rocket-outline', label: 'Capabilities', route: '(tabs)/capabilities' },
    { icon: 'briefcase-outline', label: 'Investor Deck', route: '(tabs)/investor' },
    { icon: 'search-outline', label: 'Search', route: 'search' },
    { icon: 'settings-outline', label: 'Settings', route: '(tabs)/settings' },
  ];

  return (
    <View style={[styles.drawer, { backgroundColor: theme.surface }]}>
      <View style={[styles.drawerHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
            <Text style={[styles.logoText, { color: '#fff' }]}>A</Text>
          </View>
          <View>
            <Text style={[styles.brandName, { color: theme.text }]}>ANKR</Text>
            <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>
              Knowledge Browser
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.drawerContent}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate(item.route)}
          >
            <Ionicons name={item.icon as any} size={22} color={theme.textSecondary} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}

        {bookmarks.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Bookmarks</Text>
            {bookmarks.slice(0, 5).map((bookmark) => (
              <TouchableOpacity
                key={bookmark.path}
                style={[styles.menuItem, { borderBottomColor: theme.border }]}
                onPress={() => navigation.navigate('viewer', { path: bookmark.path })}
              >
                <Ionicons name="bookmark-outline" size={18} color={theme.accent} />
                <Text
                  style={[styles.menuLabel, { color: theme.text, fontSize: 14 }]}
                  numberOfLines={1}
                >
                  {bookmark.name}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {recentFiles.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Recent</Text>
            {recentFiles.slice(0, 5).map((file) => (
              <TouchableOpacity
                key={file.path}
                style={[styles.menuItem, { borderBottomColor: theme.border }]}
                onPress={() => navigation.navigate('viewer', { path: file.path })}
              >
                <Ionicons name="time-outline" size={18} color={theme.textMuted} />
                <Text
                  style={[styles.menuLabel, { color: theme.text, fontSize: 14 }]}
                  numberOfLines={1}
                >
                  {file.name}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>

      <View style={[styles.drawerFooter, { borderTopColor: theme.border }]}>
        <Text style={[styles.version, { color: theme.textMuted }]}>ANKR Viewer v1.0.0</Text>
        <Text style={[styles.copyright, { color: theme.textMuted }]}>© 2026 ANKR Technologies</Text>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const { settings } = useAppStore();
  const theme = colors[settings.theme === 'light' ? 'light' : 'dark'];

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={settings.theme === 'light' ? 'dark' : 'light'} />
        <Drawer
          screenOptions={{
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
            headerTitleStyle: { fontWeight: '600' },
            drawerStyle: { backgroundColor: theme.surface, width: 300 },
            drawerActiveTintColor: theme.primary,
            drawerInactiveTintColor: theme.textSecondary,
          }}
          drawerContent={(props) => <CustomDrawerContent {...props} />}
        >
          <Drawer.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              drawerLabel: 'Home',
            }}
          />
          <Drawer.Screen
            name="viewer/[path]"
            options={{
              headerShown: true,
              title: 'Document Viewer',
            }}
          />
          <Drawer.Screen
            name="search"
            options={{
              headerShown: true,
              title: 'Search',
            }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
  },
  drawerHeader: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
  },
  brandTagline: {
    fontSize: 12,
  },
  drawerContent: {
    flex: 1,
    paddingTop: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 0.5,
  },
  menuLabel: {
    ...typography.body,
    flex: 1,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  drawerFooter: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  version: {
    ...typography.caption,
  },
  copyright: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
