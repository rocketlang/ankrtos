import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, RefreshControl, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, Product } from '../../services/api';
import { useCart } from '../../context/CartContext';
import ProductCard from '../../components/ProductCard';

const CATEGORY_ICONS: Record<string, string> = {
  ghee: '🫙', oils: '🫒', dryfruits: '🥜', berries: '🫐', 
  spices: '🌿', grains: '🌾', sweeteners: '🍯', seeds: '🌱', 
  wellness: '💚', pulses: '🫘'
};

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { totalItems, totalAmount } = useCart();

  useEffect(() => { loadData(); }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts(selectedCategory || undefined),
        api.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const filteredProducts = products.filter(p =>
    p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading fresh products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandIcon}>🌿</Text>
            <Text style={styles.brandName}>Ever Pure</Text>
          </View>
          <Text style={styles.tagline}>Pure & Natural Products</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={26} color="#059669" />
          {totalItems > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Trust Badges */}
      <View style={styles.trustBadges}>
        <View style={styles.trustItem}>
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <Text style={styles.trustText}>100% Genuine</Text>
        </View>
        <View style={styles.trustItem}>
          <Ionicons name="car" size={14} color="#059669" />
          <Text style={styles.trustText}>Free Delivery ₹500+</Text>
        </View>
        <View style={styles.trustItem}>
          <Ionicons name="cash" size={14} color="#059669" />
          <Text style={styles.trustText}>COD Available</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={styles.categoryIcon}>📦</Text>
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat] || '📦'}</Text>
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products */}
      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.productList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No products found</Text>
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCategory(null); }}>
              <Text style={styles.clearFilters}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Cart Summary */}
      {totalItems > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={() => navigation.navigate('Cart')}>
          <View style={styles.floatingCartLeft}>
            <Text style={styles.floatingCartItems}>{totalItems} items</Text>
            <Text style={styles.floatingCartTotal}>₹{totalAmount}</Text>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: { fontSize: 28 },
  brandName: { fontSize: 24, fontWeight: 'bold', color: '#059669', marginLeft: 8 },
  tagline: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cartButton: { position: 'relative', padding: 10 },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  trustItem: { flexDirection: 'row', alignItems: 'center' },
  trustText: { fontSize: 11, color: '#059669', marginLeft: 4, fontWeight: '500' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#111827' },
  categoriesWrapper: { marginBottom: 5 },
  categoriesContainer: { paddingHorizontal: 15, paddingVertical: 5 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  productList: { padding: 10, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
  emptyText: { color: '#6B7280', fontSize: 16, marginTop: 10 },
  clearFilters: { color: '#059669', fontSize: 14, marginTop: 10, fontWeight: '600' },
  floatingCart: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartLeft: {},
  floatingCartItems: { color: '#fff', fontSize: 12, opacity: 0.9 },
  floatingCartTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  floatingCartRight: { flexDirection: 'row', alignItems: 'center' },
  floatingCartText: { color: '#fff', fontSize: 16, fontWeight: '600', marginRight: 5 },
});
