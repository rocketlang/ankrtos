import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function DocumentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Documents Screen - Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a192f' },
  text: { color: '#64ffda', fontSize: 18 },
});
