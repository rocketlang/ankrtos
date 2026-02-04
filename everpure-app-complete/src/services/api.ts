const API_URL = 'https://ever-pure.in';

export interface Product {
  id: number;
  sku: string;
  nameEn: string;
  nameHi?: string;
  category: string;
  price: number;
  mrp: number;
  stock: number;
  imageUrl?: string;
  badge?: string;
  tags: string[];
  benefits: string[];
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ServiceArea {
  serviceable: boolean;
  pincode: string;
  city?: string;
  state?: string;
  zone: string;
  deliveryDays: number;
  deliveryCharge: number;
  codAvailable: boolean;
  freeAbove: number;
  message: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    return data;
  }

  // Auth
  async sendOtp(phone: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, otp: string) {
    return this.request<{ success: boolean; token: string; user: User }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async getMe() {
    return this.request<{ success: boolean; user: User }>('/api/auth/me');
  }

  async updateProfile(data: { name?: string; email?: string }) {
    return this.request<{ success: boolean; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Pincode
  async checkPincode(pincode: string) {
    return this.request<ServiceArea>(`/api/pincode/${pincode}`);
  }

  // GraphQL
  async graphql<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
    const { data, errors } = await response.json();
    if (errors) throw new Error(errors[0].message);
    return data;
  }

  // Products
  async getProducts(category?: string) {
    const query = `
      query GetProducts($category: String) {
        products(category: $category, limit: 100) {
          id sku nameEn nameHi category price mrp stock imageUrl badge tags benefits
        }
      }
    `;
    const data = await this.graphql<{ products: Product[] }>(query, { category });
    return data.products;
  }

  async getCategories() {
    const query = `query { categories }`;
    const data = await this.graphql<{ categories: string[] }>(query);
    return data.categories;
  }

  // Orders
  async createOrder(orderData: any) {
    return this.request<{ success: boolean; orderId: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders() {
    return this.request<{ orders: any[] }>('/api/orders');
  }

  async trackOrder(orderId: string) {
    return this.request<{ order: any }>(`/api/orders/${orderId}/track`);
  }
}

export const api = new ApiService();
