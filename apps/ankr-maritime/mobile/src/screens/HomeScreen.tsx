/**
 * Home Screen - Dashboard for field agents
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mari8X Mobile</Text>
        <Text style={styles.subtitle}>Field Agent Dashboard</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚢 Active Voyages</Text>
        <Text style={styles.cardValue}>5</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Pending Tasks</Text>
        <Text style={styles.cardValue}>12</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Current Location</Text>
        <Text style={styles.cardText}>Port of Singapore</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a5f',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#64ffda',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8892b0',
  },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: '#112240',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#64ffda',
  },
  cardTitle: {
    fontSize: 14,
    color: '#8892b0',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ccd6f6',
  },
  cardText: {
    fontSize: 18,
    color: '#ccd6f6',
  },
});
