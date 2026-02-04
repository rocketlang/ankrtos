import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../services/api';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const [added, setAdded] = useState(false);
  
  const cartItem = items.find(i => i.product.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const discount = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const outOfStock = product.stock === 0;

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  };

  return (
    <View style={styles.container}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="leaf" size={40} color="#059669" />
          </View>
        )}
        {discount > 0 && !outOfStock && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
        {product.badge && (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{product.badge}</Text>
          </View>
        )}
        {outOfStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.category}>{product.category.toUpperCase()}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.nameEn}</Text>
        
        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          {product.mrp > product.price && (
            <Text style={styles.mrp}>₹{product.mrp}</Text>
          )}
        </View>

        {/* Add/Quantity Button */}
        {outOfStock ? (
          <TouchableOpacity style={styles.notifyButton}>
            <Text style={styles.notifyText}>Notify Me</Text>
          </TouchableOpacity>
        ) : quantity > 0 ? (
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.qtyButton} 
              onPress={() => quantity === 1 ? removeFromCart(product.id) : updateQuantity(product.id, quantity - 1)}
            >
              <Ionicons name={quantity === 1 ? "trash-outline" : "remove"} size={18} color="#059669" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.qtyButton} 
              onPress={() => updateQuantity(product.id, quantity + 1)}
            >
              <Ionicons name="add" size={18} color="#059669" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addButton, added && styles.addedButton]} 
            onPress={handleAdd}
          >
            {added ? (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Added</Text>
              </>
            ) : (
              <>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#f8fdf8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tagBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  info: {
    padding: 12,
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  mrp: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  addedButton: {
    backgroundColor: '#10B981',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  notifyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#059669',
  },
  notifyText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 14,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#059669',
    padding: 4,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
});
