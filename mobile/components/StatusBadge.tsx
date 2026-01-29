import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  announced: { bg: '#DBEAFE', text: '#1E40AF' },
  gated_in: { bg: '#DCFCE7', text: '#166534' },
  grounded: { bg: '#D1FAE5', text: '#065F46' },
  on_hold: { bg: '#FEE2E2', text: '#991B1B' },
  departed: { bg: '#F3F4F6', text: '#374151' },
  in_progress: { bg: '#FEF3C7', text: '#92400E' },
  completed: { bg: '#DCFCE7', text: '#166534' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  pending: { bg: '#FEF3C7', text: '#92400E' },
  active: { bg: '#DCFCE7', text: '#166534' },
  maintenance: { bg: '#FEF3C7', text: '#92400E' },
  breakdown: { bg: '#FEE2E2', text: '#991B1B' },
  open: { bg: '#DCFCE7', text: '#166534' },
  closed: { bg: '#F3F4F6', text: '#374151' },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#374151' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{capitalize(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
