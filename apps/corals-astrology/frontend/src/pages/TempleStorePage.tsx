import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Product Categories
const categories = [
  { id: 'gemstones', name: 'Sacred Gemstones', icon: '💎', description: 'Certified Navaratna & healing crystals' },
  { id: 'puja-items', name: 'Puja Items', icon: '🪔', description: 'Complete puja essentials' },
  { id: 'yantras', name: 'Yantras & Rudraksha', icon: '🔯', description: 'Powerful spiritual tools' },
  { id: 'books', name: 'Holy Books', icon: '📚', description: 'Vedic scriptures & astrology' },
  { id: 'idols', name: 'Deity Idols', icon: '🕉️', description: 'Brass, stone & resin idols' },
  { id: 'clothing', name: 'Religious Clothing', icon: '👔', description: 'Sacred threads & traditional wear' },
];

// Featured Products
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  certified?: boolean;
  inStock: boolean;
  featured?: boolean;
  vendor: string;
  description: string;
}

const products: Product[] = [
  // Gemstones
  {
    id: 'ruby-001',
    name: 'Natural Ruby (Manik)',
    category: 'gemstones',
    price: 25000,
    originalPrice: 30000,
    image: '💎',
    rating: 4.9,
    reviews: 234,
    certified: true,
    inStock: true,
    featured: true,
    vendor: 'Certified Gems India',
    description: 'Premium natural ruby for Sun. Lab certified with authenticity report. Weight: 5 carats.'
  },
  {
    id: 'emerald-001',
    name: 'Natural Emerald (Panna)',
    category: 'gemstones',
    price: 18000,
    originalPrice: 22000,
    image: '💚',
    rating: 4.8,
    reviews: 189,
    certified: true,
    inStock: true,
    featured: true,
    vendor: 'Divine Gemstones',
    description: 'Premium emerald for Mercury. Certified. Weight: 4 carats.'
  },
  {
    id: 'blue-sapphire-001',
    name: 'Blue Sapphire (Neelam)',
    category: 'gemstones',
    price: 35000,
    image: '💙',
    rating: 5.0,
    reviews: 156,
    certified: true,
    inStock: true,
    featured: true,
    vendor: 'Ratna Gems',
    description: 'Powerful blue sapphire for Saturn. Premium quality. Weight: 6 carats.'
  },
  {
    id: 'pearl-001',
    name: 'Natural Pearl (Moti)',
    category: 'gemstones',
    price: 8000,
    originalPrice: 10000,
    image: '⚪',
    rating: 4.7,
    reviews: 298,
    certified: true,
    inStock: true,
    vendor: 'Ocean Gems',
    description: 'South sea pearl for Moon. Lustrous and certified. Weight: 7 carats.'
  },

  // Puja Items
  {
    id: 'puja-thali-001',
    name: 'Premium Brass Puja Thali Set',
    category: 'puja-items',
    price: 1499,
    originalPrice: 2499,
    image: '🪔',
    rating: 4.6,
    reviews: 567,
    inStock: true,
    featured: true,
    vendor: 'Sacred Essentials',
    description: '8-piece brass thali set with diya, incense holder, bell, and more.'
  },
  {
    id: 'dhoop-001',
    name: 'Sandalwood Dhoop Sticks (100 pcs)',
    category: 'puja-items',
    price: 299,
    image: '🌿',
    rating: 4.8,
    reviews: 1234,
    inStock: true,
    vendor: 'Mysore Incense Co.',
    description: 'Pure sandalwood dhoop for daily puja. Long-lasting fragrance.'
  },
  {
    id: 'kalash-001',
    name: 'Copper Kalash Set',
    category: 'puja-items',
    price: 999,
    image: '🏺',
    rating: 4.7,
    reviews: 345,
    inStock: true,
    featured: true,
    vendor: 'Temple Supplies',
    description: 'Traditional copper kalash for all ceremonies. Includes coconut holder.'
  },

  // Yantras
  {
    id: 'sri-yantra-001',
    name: 'Sri Yantra - Gold Plated',
    category: 'yantras',
    price: 2499,
    originalPrice: 3999,
    image: '🔯',
    rating: 5.0,
    reviews: 678,
    inStock: true,
    featured: true,
    vendor: 'Yantra Emporium',
    description: 'Powerful Sri Yantra for prosperity and peace. Energized by pandits.'
  },
  {
    id: 'rudraksha-mala-001',
    name: '5 Mukhi Rudraksha Mala (108 beads)',
    category: 'yantras',
    price: 1999,
    image: '📿',
    rating: 4.9,
    reviews: 890,
    inStock: true,
    featured: true,
    vendor: 'Himalayan Rudrakshas',
    description: 'Authentic 5-faced rudraksha mala from Nepal. Lab tested.'
  },
  {
    id: 'navagraha-yantra-001',
    name: 'Navagraha Yantra',
    category: 'yantras',
    price: 1499,
    image: '✨',
    rating: 4.8,
    reviews: 456,
    inStock: true,
    vendor: 'Divine Yantras',
    description: 'Nine planetary yantra for balancing all planetary influences.'
  },

  // Books
  {
    id: 'bhagavad-gita-001',
    name: 'Bhagavad Gita - Sanskrit & Hindi',
    category: 'books',
    price: 499,
    image: '📖',
    rating: 4.9,
    reviews: 2345,
    inStock: true,
    featured: true,
    vendor: 'Gita Press',
    description: 'Complete Bhagavad Gita with commentary by Acharya Sharma.'
  },
  {
    id: 'vedic-astrology-001',
    name: 'Complete Guide to Vedic Astrology',
    category: 'books',
    price: 799,
    image: '📚',
    rating: 4.7,
    reviews: 567,
    inStock: true,
    vendor: 'Astro Publications',
    description: 'Comprehensive book on Vedic astrology by renowned astrologers.'
  },

  // Idols
  {
    id: 'ganesh-idol-001',
    name: 'Lord Ganesh Brass Idol (6 inch)',
    category: 'idols',
    price: 1999,
    originalPrice: 2999,
    image: '🐘',
    rating: 4.9,
    reviews: 789,
    inStock: true,
    featured: true,
    vendor: 'Divine Idols',
    description: 'Beautiful brass Ganesh idol for home temple. Handcrafted.'
  },
  {
    id: 'lakshmi-idol-001',
    name: 'Goddess Lakshmi Stone Idol',
    category: 'idols',
    price: 3999,
    image: '🪷',
    rating: 5.0,
    reviews: 234,
    inStock: true,
    vendor: 'Sacred Sculptures',
    description: 'Hand-carved stone Lakshmi idol. 8 inches. Temple quality.'
  },

  // Clothing
  {
    id: 'janeu-001',
    name: 'Sacred Thread (Janeu) - Set of 3',
    category: 'clothing',
    price: 299,
    image: '🧵',
    rating: 4.6,
    reviews: 456,
    inStock: true,
    vendor: 'Traditional Threads',
    description: 'Pure cotton sacred thread for Brahmins. Authentic quality.'
  },
  {
    id: 'dhoti-kurta-001',
    name: 'White Dhoti & Kurta Set',
    category: 'clothing',
    price: 1499,
    image: '👔',
    rating: 4.7,
    reviews: 234,
    inStock: true,
    featured: true,
    vendor: 'Pooja Garments',
    description: 'Traditional white dhoti and kurta set for ceremonies. Pure cotton.'
  },
];

const TempleStorePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'featured':
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const cartItemCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [productId, count]) => {
    const product = products.find(p => p.id === productId);
    return sum + (product?.price || 0) * count;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-orange-600">
              🕉️ CORALS Store
            </Link>

            <div className="flex items-center gap-6">
              <Link to="/" className="text-gray-700 hover:text-orange-600">Home</Link>
              <Link to="/book-pandit" className="text-gray-700 hover:text-orange-600">Book Pandit</Link>
              <Link to="/astrology" className="text-gray-700 hover:text-orange-600">Astrology</Link>
              <Link to="/cart" className="relative">
                <span className="text-2xl">🛒</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">🛍️ Sacred Temple Store</h1>
          <p className="text-xl mb-6">
            Authentic Spiritual Products | Certified Gemstones | Puja Essentials
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>100% Authentic</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>Lab Certified Gems</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>Verified Sellers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="bg-white py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for gemstones, puja items, yantras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 border-2 border-gray-300 rounded-full focus:outline-none focus:border-orange-500"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`p-4 rounded-lg text-center transition-all ${
                selectedCategory === 'all'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="text-3xl mb-2">🛍️</div>
              <div className="text-sm font-semibold">All Products</div>
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg text-center transition-all ${
                  selectedCategory === category.id
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <div className="text-sm font-semibold">{category.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Sort */}
      <section className="py-4 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-700">
              Showing <span className="font-semibold">{sortedProducts.length}</span> products
              {selectedCategory !== 'all' && (
                <span> in <span className="font-semibold">{categories.find(c => c.id === selectedCategory)?.name}</span></span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
                  {/* Product Image */}
                  <div className="h-48 bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center relative">
                    <div className="text-6xl">{product.image}</div>
                    {product.featured && (
                      <span className="absolute top-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                    )}
                    {product.certified && (
                      <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        ✓ Certified
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="text-xs text-gray-500 mb-1">{product.vendor}</div>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex text-yellow-500">
                        {'⭐'.repeat(Math.round(product.rating))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {product.rating} ({product.reviews})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl font-bold text-orange-600">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <>
                          <span className="text-gray-400 line-through">
                            ₹{product.originalPrice.toLocaleString()}
                          </span>
                          <span className="text-green-600 text-sm font-semibold">
                            {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    {/* Stock Status */}
                    {product.inStock ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => addToCart(product.id)}
                          className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Add to Cart
                        </button>
                        <Link
                          to={`/product/${product.id}`}
                          className="px-4 py-2 border-2 border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                        >
                          View
                        </Link>
                      </div>
                    ) : (
                      <button className="w-full bg-gray-300 text-gray-600 py-2 rounded-lg cursor-not-allowed">
                        Out of Stock
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Buy From Us */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Shop With Us?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">100% Authentic</h3>
              <p className="text-gray-600">All products verified & genuine. No fake items.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-2">Lab Certified Gems</h3>
              <p className="text-gray-600">Every gemstone comes with authenticity certificate.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">2-7 days delivery across India. Secure packaging.</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure Payment</h3>
              <p className="text-gray-600">100% safe transactions via Razorpay.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Cart Summary */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 border-2 border-orange-600 z-50">
          <div className="text-sm font-semibold mb-2">
            Cart ({cartItemCount} items)
          </div>
          <div className="text-2xl font-bold text-orange-600 mb-3">
            ₹{cartTotal.toLocaleString()}
          </div>
          <Link
            to="/cart"
            className="block w-full bg-orange-600 text-white text-center py-2 rounded-lg hover:bg-orange-700"
          >
            View Cart
          </Link>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">🕉️ CORALS Store</h3>
              <p className="text-sm mb-4">
                Your trusted source for authentic spiritual products and certified gemstones.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/store?category=gemstones" className="hover:text-orange-400">Gemstones</Link></li>
                <li><Link to="/store?category=puja-items" className="hover:text-orange-400">Puja Items</Link></li>
                <li><Link to="/store?category=yantras" className="hover:text-orange-400">Yantras</Link></li>
                <li><Link to="/store?category=books" className="hover:text-orange-400">Books</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/help" className="hover:text-orange-400">Help Center</Link></li>
                <li><Link to="/shipping" className="hover:text-orange-400">Shipping Info</Link></li>
                <li><Link to="/returns" className="hover:text-orange-400">Returns</Link></li>
                <li><Link to="/contact" className="hover:text-orange-400">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>📧 store@coralsastrology.com</li>
                <li>📞 +91-XXXXXXXXXX</li>
                <li>🕐 Mon-Sat: 9 AM - 8 PM</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="text-center text-sm mb-4">
              <p className="mb-2">⚡ <span className="font-semibold">Platform Powered by ANKR.IN</span></p>
              <p>💼 Managed by <span className="font-semibold">PowerBox IT Solutions Pvt Ltd</span></p>
              <p className="text-xs text-gray-500 mt-2">Enterprise Software Development & IT Solutions</p>
            </div>
            <div className="text-center text-sm text-gray-500">
              <p>Founded by <span className="font-semibold text-orange-400">Jyotish Acharya Rakesh Sharma</span></p>
              <p className="mt-2">© 2024 CORALS Astrology. All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TempleStorePage;
