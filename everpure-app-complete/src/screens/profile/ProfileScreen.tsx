import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: 'receipt-outline', label: 'My Orders', onPress: () => Alert.alert('Coming Soon', 'Order history will be available soon!') },
    { icon: 'location-outline', label: 'Saved Addresses', onPress: () => Alert.alert('Coming Soon', 'Address management coming soon!') },
    { icon: 'heart-outline', label: 'Wishlist', onPress: () => Alert.alert('Coming Soon', 'Wishlist feature coming soon!') },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => Linking.openURL('https://wa.me/919711121512') },
    { icon: 'document-text-outline', label: 'Terms & Conditions', onPress: () => Linking.openURL('https://ever-pure.in/terms') },
    { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => Linking.openURL('https://ever-pure.in/privacy') },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || user?.phone?.[0] || 'U'}</Text>
        </View>
        <View style={styles.userInfo}>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoFocus
            />
          ) : (
            <Text style={styles.userName}>{user?.name || 'Set your name'}</Text>
          )}
          <Text style={styles.userPhone}>{user?.phone}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => {
          if (editing && name !== user?.name) {
            // Save name - you can add API call here
            Alert.alert('Saved', 'Profile updated successfully!');
          }
          setEditing(!editing);
        }}>
          <Ionicons name={editing ? 'checkmark' : 'pencil'} size={20} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Wishlist</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>₹0</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={22} color="#059669" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Contact */}
      <View style={styles.contactContainer}>
        <Text style={styles.contactTitle}>Need Help?</Text>
        <View style={styles.contactButtons}>
          <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL('tel:+919711121512')}>
            <Ionicons name="call" size={20} color="#059669" />
            <Text style={styles.contactButtonText}>Call Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactButton, styles.whatsappButton]} onPress={() => Linking.openURL('https://wa.me/919711121512')}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={[styles.contactButtonText, { color: '#fff' }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>🌿 Ever Pure</Text>
        <Text style={styles.appTagline}>Pure & Natural Products</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appCopyright}>© 2026 MSG Pure Grocers</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  userInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  userPhone: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  nameInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    paddingBottom: 5,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 15,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#059669' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB' },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: { fontSize: 16, color: '#111827' },
  contactContainer: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 20,
  },
  contactTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 15 },
  contactButtons: { flexDirection: 'row', gap: 10 },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#059669',
  },
  whatsappButton: { backgroundColor: '#25D366', borderColor: '#25D366' },
  contactButtonText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#059669' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginTop: 15,
    marginHorizontal: 15,
    borderRadius: 12,
    padding: 15,
  },
  logoutText: { marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#EF4444' },
  appInfo: { alignItems: 'center', paddingVertical: 30 },
  appName: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
  appTagline: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  appVersion: { fontSize: 11, color: '#9CA3AF', marginTop: 8 },
  appCopyright: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});
