import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';

interface ScanButtonProps {
  label?: string;
  onScan: (value: string) => void;
}

export function ScanButton({ label = 'Scan', onScan }: ScanButtonProps) {
  const handlePress = () => {
    // In production, this would open expo-camera BarCodeScanner
    // For now, prompt manual entry
    Alert.prompt?.(
      'Manual Entry',
      'Enter the value (truck number, container number, etc.)',
      (text) => {
        if (text?.trim()) onScan(text.trim());
      },
    ) ?? Alert.alert('Scan', 'Camera scanning requires a native device. Use manual entry.');
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.7}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
