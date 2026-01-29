import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFacility } from '@/hooks/use-facility';

const modules = [
  { title: 'Gate Kiosk', description: 'Truck check-in/out, appointment lookup', route: '/(tabs)/gate' as const, color: '#3B82F6' },
  { title: 'Yard Operations', description: 'Container location, move orders', route: '/(tabs)/yard' as const, color: '#10B981' },
  { title: 'Equipment', description: 'Checklists, inspections, maintenance', route: '/(tabs)/equipment' as const, color: '#F59E0B' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { facilityId, facilities, setFacilityId } = useFacility();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>ankrICD Mobile</Text>
      <Text style={styles.subtitle}>ICD & CFS Operations</Text>

      {/* Facility Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Facility</Text>
        <View style={styles.facilityList}>
          {facilities.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.facilityCard, facilityId === f.id && styles.facilityCardActive]}
              onPress={() => setFacilityId(f.id)}
            >
              <Text style={[styles.facilityName, facilityId === f.id && styles.facilityNameActive]}>
                {f.name}
              </Text>
              <Text style={[styles.facilityCode, facilityId === f.id && styles.facilityCodeActive]}>
                {f.code}
              </Text>
            </TouchableOpacity>
          ))}
          {facilities.length === 0 && (
            <Text style={styles.emptyText}>No facilities available</Text>
          )}
        </View>
      </View>

      {/* Module Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Modules</Text>
        {modules.map((mod) => (
          <TouchableOpacity
            key={mod.route}
            style={styles.moduleCard}
            onPress={() => router.push(mod.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.moduleAccent, { backgroundColor: mod.color }]} />
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleDesc}>{mod.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  facilityList: { gap: 8 },
  facilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  facilityCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  facilityName: { fontSize: 15, fontWeight: '600', color: '#374151' },
  facilityNameActive: { color: '#1D4ED8' },
  facilityCode: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  facilityCodeActive: { color: '#3B82F6' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: 20 },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  moduleAccent: { width: 4 },
  moduleContent: { flex: 1, padding: 16 },
  moduleTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  moduleDesc: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
