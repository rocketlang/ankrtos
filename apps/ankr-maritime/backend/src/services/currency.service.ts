/**
 * Currency Service - Multi-Currency FX Rate Management
 * Priority 1: Port Agency Portal
 *
 * Features:
 * - Live FX rate fetching from exchangerate-api.com
 * - Redis caching with 24-hour TTL
 * - Fallback to last known rates
 * - Support for 7+ currencies
 */

import Redis from 'ioredis';

export interface FXRate {
  base: string;
  rates: Record<string, number>;
  lastUpdated: Date;
}

export interface ConversionResult {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  cachedAt: Date;
}

export class CurrencyService {
  private redis: Redis;
  private apiUrl = 'https://api.exchangerate-api.com/v4/latest';
  private cacheTTL = 24 * 60 * 60; // 24 hours in seconds

  // Supported currencies for Port Agency Portal
  private supportedCurrencies = [
    'USD', // US Dollar (base currency)
    'EUR', // Euro
    'GBP', // British Pound
    'SGD', // Singapore Dollar
    'INR', // Indian Rupee
    'AED', // UAE Dirham
    'CNY', // Chinese Yuan
    'JPY', // Japanese Yen
    'NOK', // Norwegian Krone
  ];

  constructor(redisClient?: Redis) {
    this.redis = redisClient || new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    });
  }

  /**
   * Get exchange rate from baseCurrency to targetCurrency
   */
  async getExchangeRate(
    baseCurrency: string = 'USD',
    targetCurrency: string
  ): Promise<number> {
    if (baseCurrency === targetCurrency) return 1.0;

    const rates = await this.getRates(baseCurrency);
    const rate = rates.rates[targetCurrency];

    if (!rate) {
      throw new Error(
        `Exchange rate not found for ${baseCurrency} to ${targetCurrency}`
      );
    }

    return rate;
  }

  /**
   * Convert amount from one currency to another
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionResult> {
    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount: amount,
        rate: 1.0,
        cachedAt: new Date(),
      };
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;

    const rates = await this.getRates(fromCurrency);

    return {
      fromCurrency,
      toCurrency,
      amount,
      convertedAmount,
      rate,
      cachedAt: rates.lastUpdated,
    };
  }

  /**
   * Get all rates for a base currency (with caching)
   */
  async getRates(baseCurrency: string = 'USD'): Promise<FXRate> {
    // Check cache first
    const cacheKey = `fx:rates:${baseCurrency}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      return {
        ...data,
        lastUpdated: new Date(data.lastUpdated),
      };
    }

    // Fetch live rates
    try {
      const rates = await this.fetchLiveRates(baseCurrency);

      // Cache for 24 hours
      await this.redis.setex(
        cacheKey,
        this.cacheTTL,
        JSON.stringify({
          ...rates,
          lastUpdated: rates.lastUpdated.toISOString(),
        })
      );

      return rates;
    } catch (error) {
      console.error('Failed to fetch live rates:', error);

      // Try to get last known rates from cache (even if expired)
      const lastKnown = await this.getLastKnownRates(baseCurrency);
      if (lastKnown) {
        console.warn('Using last known rates (may be stale)');
        return lastKnown;
      }

      throw new Error(
        `Failed to fetch FX rates for ${baseCurrency} and no cached rates available`
      );
    }
  }

  /**
   * Fetch live rates from exchangerate-api.com
   */
  private async fetchLiveRates(baseCurrency: string): Promise<FXRate> {
    const response = await fetch(`${this.apiUrl}/${baseCurrency}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch rates: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return {
      base: data.base,
      rates: data.rates,
      lastUpdated: new Date(data.time_last_updated * 1000),
    };
  }

  /**
   * Get last known rates (even if cache expired)
   */
  private async getLastKnownRates(
    baseCurrency: string
  ): Promise<FXRate | null> {
    const cacheKey = `fx:rates:${baseCurrency}`;

    // Try to get from cache without TTL check
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      return {
        ...data,
        lastUpdated: new Date(data.lastUpdated),
      };
    }

    return null;
  }

  /**
   * Get all cached rates
   */
  async getCachedRates(): Promise<Record<string, FXRate>> {
    const result: Record<string, FXRate> = {};

    for (const currency of this.supportedCurrencies) {
      const cacheKey = `fx:rates:${currency}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        const data = JSON.parse(cached);
        result[currency] = {
          ...data,
          lastUpdated: new Date(data.lastUpdated),
        };
      }
    }

    return result;
  }

  /**
   * Warm up cache by fetching rates for all supported currencies
   */
  async warmupCache(): Promise<void> {
    console.log('🔥 Warming up FX rate cache...');

    const promises = this.supportedCurrencies.map(async (currency) => {
      try {
        await this.getRates(currency);
        console.log(`  ✅ Cached rates for ${currency}`);
      } catch (error) {
        console.error(`  ❌ Failed to cache rates for ${currency}:`, error);
      }
    });

    await Promise.all(promises);

    console.log('✅ FX rate cache warmup complete');
  }

  /**
   * Clear cache for a specific currency
   */
  async clearCache(baseCurrency?: string): Promise<void> {
    if (baseCurrency) {
      const cacheKey = `fx:rates:${baseCurrency}`;
      await this.redis.del(cacheKey);
      console.log(`Cleared FX cache for ${baseCurrency}`);
    } else {
      // Clear all FX caches
      const keys = await this.redis.keys('fx:rates:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`Cleared ${keys.length} FX rate caches`);
      }
    }
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return [...this.supportedCurrencies];
  }

  /**
   * Check if currency is supported
   */
  isSupported(currency: string): boolean {
    return this.supportedCurrencies.includes(currency.toUpperCase());
  }

  /**
   * Disconnect Redis
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let currencyService: CurrencyService | null = null;

export function getCurrencyService(): CurrencyService {
  if (!currencyService) {
    currencyService = new CurrencyService();
  }
  return currencyService;
}
