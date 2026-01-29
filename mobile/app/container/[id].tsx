import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBadge } from '@/components/StatusBadge';

export default function ContainerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Container Detail</Text>
        <Text style={styles.id}>ID: {id}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Container Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Container ID</Text>
          <Text style={styles.value}>{id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <StatusBadge status="grounded" />
        </View>
        <Text style={styles.placeholder}>
          Full container details (location, holds, movements, customs status) will load from the GraphQL API when connected to the backend.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  id: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontFamily: 'monospace' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: { fontSize: 14, color: '#6B7280' },
  value: { fontSize: 14, fontWeight: '500', color: '#111827' },
  placeholder: { fontSize: 13, color: '#9CA3AF', marginTop: 16, fontStyle: 'italic' },
});
