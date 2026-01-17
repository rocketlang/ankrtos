/**
 * Customer Lookup Screen - BFC Staff App
 */

import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, gql } from '@apollo/client';

const SEARCH_CUSTOMERS = gql`
  query SearchCustomers($query: String!, $limit: Int) {
    searchCustomers(query: $query, limit: $limit) {
      id
      name
      phone
      email
      kycStatus
      segment
      riskScore
    }
  }
`;

// Mock data for demo
const mockResults = [
  { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', kycStatus: 'verified', segment: 'Premium', riskScore: 0.2 },
  { id: '2', name: 'Priya Patel', phone: '+91 87654 32109', kycStatus: 'pending', segment: 'Standard', riskScore: 0.4 },
  { id: '3', name: 'Amit Kumar', phone: '+91 76543 21098', kycStatus: 'expired', segment: 'Standard', riskScore: 0.6 },
];

const kycStatusColors: Record<string, { bg: string; text: string }> = {
  verified: { bg: '#dcfce7', text: '#16a34a' },
  pending: { bg: '#fef3c7', text: '#d97706' },
  expired: { bg: '#fee2e2', text: '#dc2626' },
  rejected: { bg: '#fee2e2', text: '#dc2626' },
};

export default function CustomerLookupScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof mockResults>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      const filtered = mockResults.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery)
      );
      setSearchResults(filtered.length > 0 ? filtered : mockResults);
      setIsSearching(false);
    }, 500);
  };

  const getKycStatusStyle = (status: string) => {
    return kycStatusColors[status] || kycStatusColors.pending;
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return '#22c55e';
    if (score < 0.6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or ID"
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Filters */}
      <View style={styles.filters}>
        <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
          <Text style={[styles.filterText, styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Pending KYC</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>My Customers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>High Risk</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : searchResults.length > 0 ? (
        <View style={styles.results}>
          <Text style={styles.resultsCount}>{searchResults.length} customers found</Text>
          {searchResults.map((customer) => (
            <Link key={customer.id} href={`/customer/${customer.id}`} asChild>
              <TouchableOpacity style={styles.customerCard}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.avatarText}>{customer.name.charAt(0)}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerPhone}>{customer.phone}</Text>
                  <View style={styles.customerMeta}>
                    <View
                      style={[
                        styles.kycBadge,
                        { backgroundColor: getKycStatusStyle(customer.kycStatus).bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.kycText,
                          { color: getKycStatusStyle(customer.kycStatus).text },
                        ]}
                      >
                        {customer.kycStatus.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.segmentBadge}>
                      <Text style={styles.segmentText}>{customer.segment}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.riskIndicator}>
                  <View
                    style={[
                      styles.riskDot,
                      { backgroundColor: getRiskColor(customer.riskScore) },
                    ]}
                  />
                  <Text style={styles.riskScore}>
                    {Math.round(customer.riskScore * 100)}%
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Search for Customers</Text>
          <Text style={styles.emptyText}>
            Enter a name, phone number, or customer ID to search
          </Text>
        </View>
      )}

      {/* Recent Searches */}
      {searchResults.length === 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <View style={styles.recentList}>
            {['Rahul Sharma', '+91 98765', 'CUS-001'].map((term, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentItem}
                onPress={() => {
                  setSearchQuery(term);
                  handleSearch();
                }}
              >
                <Ionicons name="time-outline" size={16} color="#64748b" />
                <Text style={styles.recentText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1e293b',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 15,
  },
  results: {
    paddingHorizontal: 16,
  },
  resultsCount: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  customerPhone: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  customerMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  kycBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kycText: {
    fontSize: 10,
    fontWeight: '600',
  },
  segmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  segmentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  riskIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  riskScore: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  recentSection: {
    padding: 16,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  recentText: {
    fontSize: 14,
    color: '#1e293b',
  },
});
