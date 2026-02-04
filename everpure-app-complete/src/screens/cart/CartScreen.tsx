import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';

export default function CartScreen({ navigation }: any) {
  const { items, updateQuantity, removeFromCart, totalAmount, totalItems, clearCart } = useCart();

  const delivery = totalAmount >= 500 ? 0 : 50;
  const total = totalAmount + delivery;

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add some products to get started</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Your Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemImage}>
              {item.product.imageUrl ? (
                <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="leaf" size={30} color="#059669" />
                </View>
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.nameEn}</Text>
              <Text style={styles.itemPrice}>₹{item.product.price} each</Text>
              {item.product.mrp > item.product.price && (
                <Text style={styles.itemMrp}>₹{item.product.mrp}</Text>
              )}
            </View>
            <View style={styles.quantityContainer}>
              <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.product.id, item.quantity - 1)}>
                <Ionicons name="remove" size={18} color="#059669" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={() => updateQuantity(item.product.id, item.quantity + 1)}>
                <Ionicons name="add" size={18} color="#059669" />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>₹{item.product.price * item.quantity}</Text>
            <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(item.product.id)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({totalItems})</Text>
              <Text style={styles.summaryValue}>₹{totalAmount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, delivery === 0 && styles.freeDelivery]}>
                {delivery === 0 ? '🎉 FREE' : `₹${delivery}`}
              </Text>
            </View>
            {totalAmount < 500 && (
              <Text style={styles.freeHint}>Add ₹{500 - totalAmount} more for FREE delivery</Text>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>
        }
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>₹{total}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  clearText: { color: '#EF4444', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  shopButton: { marginTop: 20, backgroundColor: '#059669', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8 },
  shopButtonText: { color: '#fff', fontWeight: '600' },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
  },
  itemImage: { width: 60, height: 60, marginRight: 12 },
  image: { width: 60, height: 60, borderRadius: 8 },
  imagePlaceholder: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemPrice: { fontSize: 12, color: '#059669', marginTop: 2 },
  itemMrp: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  quantityButton: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  quantity: { marginHorizontal: 10, fontSize: 16, fontWeight: '600', color: '#111827' },
  itemTotal: { fontSize: 14, fontWeight: 'bold', color: '#059669', marginRight: 8, minWidth: 50, textAlign: 'right' },
  removeButton: { padding: 5 },
  summary: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, color: '#111827' },
  freeDelivery: { color: '#059669', fontWeight: '600' },
  freeHint: { fontSize: 12, color: '#F59E0B', marginBottom: 10 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, marginTop: 5 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 12, color: '#6B7280' },
  footerTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#059669' },
  checkoutButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontWeight: '600', fontSize: 16, marginRight: 8 },
});
