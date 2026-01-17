/**
 * Profile Screen - BFC Customer App
 */

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  { icon: 'person', label: 'Personal Details', route: '/profile/details' },
  { icon: 'shield-checkmark', label: 'KYC Status', route: '/profile/kyc', badge: 'Verified' },
  { icon: 'notifications', label: 'Notifications', route: '/profile/notifications' },
  { icon: 'lock-closed', label: 'Security', route: '/profile/security' },
  { icon: 'document-text', label: 'Statements', route: '/profile/statements' },
  { icon: 'help-circle', label: 'Help & Support', route: '/profile/support' },
  { icon: 'information-circle', label: 'About', route: '/profile/about' },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>RS</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>Rahul Sharma</Text>
          <Text style={styles.userEmail}>r***a@example.com</Text>
          <View style={styles.kycBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
            <Text style={styles.kycText}>KYC Verified</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={18} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Customer ID */}
      <View style={styles.customerIdCard}>
        <View>
          <Text style={styles.customerIdLabel}>Customer ID</Text>
          <Text style={styles.customerIdValue}>CIF-2020-45678</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="copy-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon as any} size={22} color="#64748b" />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <View style={styles.menuRight}>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton}>
        <Ionicons name="log-out" size={22} color="#dc2626" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  kycText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
  },
  customerIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f9ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  customerIdLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  customerIdValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },
  menu: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    marginLeft: 12,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  version: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 32,
  },
});
