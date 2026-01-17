/**
 * Document Scanner Screen - BFC Staff App
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type DocumentType = 'aadhaar' | 'pan' | 'address' | 'photo';

const documentTypes: { key: DocumentType; label: string; icon: string; color: string }[] = [
  { key: 'aadhaar', label: 'Aadhaar Card', icon: 'card', color: '#3b82f6' },
  { key: 'pan', label: 'PAN Card', icon: 'document-text', color: '#8b5cf6' },
  { key: 'address', label: 'Address Proof', icon: 'location', color: '#22c55e' },
  { key: 'photo', label: 'Customer Photo', icon: 'person', color: '#f59e0b' },
];

export default function KYCScanScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<DocumentType>('aadhaar');
  const [isScanning, setIsScanning] = useState(false);

  const handleCapture = () => {
    setIsScanning(true);

    // Simulate camera capture
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert(
        'Document Captured',
        'Document has been captured successfully. Would you like to proceed with OCR verification?',
        [
          { text: 'Retake', style: 'cancel' },
          {
            text: 'Verify',
            onPress: () => {
              Alert.alert(
                'Verification Complete',
                'Document verified successfully!',
                [{ text: 'Done', onPress: () => router.back() }]
              );
            }
          },
        ]
      );
    }, 1500);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Scan Document',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />
      <View style={styles.container}>
        {/* Document Type Selector */}
        <View style={styles.typeSelector}>
          {documentTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeButton,
                selectedType === type.key && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType(type.key)}
            >
              <Ionicons
                name={type.icon as any}
                size={18}
                color={selectedType === type.key ? '#fff' : '#64748b'}
              />
              <Text
                style={[
                  styles.typeLabel,
                  selectedType === type.key && styles.typeLabelActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Camera Preview (Mock) */}
        <View style={styles.cameraContainer}>
          <View style={styles.cameraPreview}>
            {isScanning ? (
              <View style={styles.scanningOverlay}>
                <View style={styles.scanLine} />
                <Text style={styles.scanningText}>Scanning...</Text>
              </View>
            ) : (
              <>
                <View style={styles.frameCorner} />
                <View style={[styles.frameCorner, styles.frameCornerTR]} />
                <View style={[styles.frameCorner, styles.frameCornerBL]} />
                <View style={[styles.frameCorner, styles.frameCornerBR]} />

                <View style={styles.guideContainer}>
                  <Ionicons
                    name={documentTypes.find(t => t.key === selectedType)?.icon as any}
                    size={48}
                    color="rgba(255,255,255,0.5)"
                  />
                  <Text style={styles.guideText}>
                    Position {selectedType === 'photo' ? 'face' : 'document'} within frame
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <Ionicons name="sunny" size={20} color="#f59e0b" />
            <Text style={styles.instructionText}>Ensure good lighting</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="hand-left" size={20} color="#3b82f6" />
            <Text style={styles.instructionText}>Hold steady</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="scan" size={20} color="#22c55e" />
            <Text style={styles.instructionText}>Fit in frame</Text>
          </View>
        </View>

        {/* Capture Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.galleryButton}>
            <Ionicons name="images" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={isScanning}
          >
            <View style={styles.captureInner}>
              {isScanning ? (
                <Ionicons name="hourglass" size={32} color="#3b82f6" />
              ) : (
                <Ionicons name="camera" size={32} color="#3b82f6" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.flashButton}>
            <Ionicons name="flash" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={() => {
              Alert.alert('Manual Entry', 'Opening manual entry form...');
            }}
          >
            <Ionicons name="create" size={20} color="#3b82f6" />
            <Text style={styles.manualEntryText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    justifyContent: 'center',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  typeLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  typeLabelActive: {
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
    padding: 20,
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  frameCorner: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#3b82f6',
    borderTopLeftRadius: 8,
  },
  frameCornerTR: {
    left: undefined,
    right: 40,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
  },
  frameCornerBL: {
    top: undefined,
    bottom: 40,
    borderTopWidth: 0,
    borderBottomWidth: 3,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 8,
  },
  frameCornerBR: {
    top: undefined,
    left: undefined,
    right: 40,
    bottom: 40,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 8,
  },
  guideContainer: {
    alignItems: 'center',
  },
  guideText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 12,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  scanningText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
  instructions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  instructionItem: {
    alignItems: 'center',
    gap: 6,
  },
  instructionText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  captureInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  flashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  manualEntryText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});
