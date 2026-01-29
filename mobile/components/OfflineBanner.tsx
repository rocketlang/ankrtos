import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOffline } from '@/hooks/use-offline';

export function OfflineBanner() {
  const { isOnline, queueLength, syncNow } = useOffline();

  if (isOnline && queueLength === 0) return null;

  return (
    <View style={[styles.banner, isOnline ? styles.syncing : styles.offline]}>
      {!isOnline ? (
        <Text style={styles.text}>You are offline. Changes will sync when connected.</Text>
      ) : (
        <TouchableOpacity onPress={syncNow} style={styles.syncRow}>
          <Text style={styles.text}>{queueLength} pending changes.</Text>
          <Text style={styles.syncLink}> Sync now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offline: {
    backgroundColor: '#FEE2E2',
  },
  syncing: {
    backgroundColor: '#FEF3C7',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});
