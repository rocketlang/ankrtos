/**
 * Currency Conversion Service
 *
 * Live FX rate management with Redis caching (24-hour TTL)
 * Uses exchangerate-api.com (1500 req/month free tier)
 */

import axios from 'axios';
import Redis from 'ioredis';

// Redis client singleton
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      lazyConnect: true,
    });
  }
  return redis;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  converted: number;
  rate: number;
  cached: boolean;
}

class CurrencyService {
  private readonly CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly CACHE_KEY_PREFIX = 'fx_rates:';
  private readonly API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

  // Fallback rates (updated manually if API unavailable)
  private readonly FALLBACK_RATES: Record<string, number> = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.12,
    SGD: 1.34,
    AED: 3.67,
    JPY: 149.50,
    CNY: 7.24,
  };

  /**
   * Get exchange rate from one currency to another
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    // Same currency, no conversion needed
    if (from === to) {
      return 1.0;
    }

    try {
      // Try to get from cache first
      const cachedRates = await this.getCachedRates(from);

      if (cachedRates && cachedRates.rates[to]) {
        return cachedRates.rates[to];
      }

      // Fetch live rates
      const liveRates = await this.fetchLiveRates(from);

      if (liveRates && liveRates.rates[to]) {
        return liveRates.rates[to];
      }

      // Fallback to hardcoded rates
      console.warn(`Using fallback rates for ${from} -> ${to}`);
      return this.getFallbackRate(from, to);

    } catch (error) {
      console.error(`Failed to get exchange rate ${from} -> ${to}:`, error);
      return this.getFallbackRate(from, to);
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convert(amount: number, from: string, to: string): Promise<ConversionResult> {
    const rate = await this.getExchangeRate(from, to);
    const converted = amount * rate;

    // Check if rate was from cache
    const cachedRates = await this.getCachedRates(from);
    const cached = cachedRates !== null;

    return {
      from,
      to,
      amount,
      converted,
      rate,
      cached,
    };
  }

  /**
   * Fetch live exchange rates from API
   */
  async fetchLiveRates(base: string = 'USD'): Promise<ExchangeRates | null> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/${base}`, {
        timeout: 5000,
      });

      const rates: ExchangeRates = {
        base: response.data.base,
        rates: response.data.rates,
        timestamp: Date.now(),
      };

      // Cache the rates
      await this.cacheRates(base, rates);

      return rates;

    } catch (error) {
      console.error(`Failed to fetch live rates for ${base}:`, error);
      return null;
    }
  }

  /**
   * Get cached exchange rates from Redis
   */
  async getCachedRates(base: string): Promise<ExchangeRates | null> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${base}`;
      const cached = await getRedisClient().get(cacheKey);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as ExchangeRates;

    } catch (error) {
      console.error(`Failed to get cached rates for ${base}:`, error);
      return null;
    }
  }

  /**
   * Cache exchange rates in Redis
   */
  private async cacheRates(base: string, rates: ExchangeRates): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${base}`;
      await getRedisClient().setex(cacheKey, this.CACHE_TTL, JSON.stringify(rates));
    } catch (error) {
      console.error(`Failed to cache rates for ${base}:`, error);
    }
  }

  /**
   * Get fallback exchange rate (from USD)
   */
  private getFallbackRate(from: string, to: string): number {
    const fromRate = this.FALLBACK_RATES[from] || 1.0;
    const toRate = this.FALLBACK_RATES[to] || 1.0;

    // Convert via USD: from -> USD -> to
    return toRate / fromRate;
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): string[] {
    return Object.keys(this.FALLBACK_RATES);
  }

  /**
   * Batch convert multiple amounts
   */
  async convertBatch(
    conversions: Array<{ amount: number; from: string; to: string }>
  ): Promise<ConversionResult[]> {
    return Promise.all(
      conversions.map(c => this.convert(c.amount, c.from, c.to))
    );
  }

  /**
   * Convert all tariffs to a target currency
   */
  async convertTariffs(
    tariffs: Array<{ amount: number; currency: string }>,
    targetCurrency: string
  ): Promise<Array<{ original: number; originalCurrency: string; converted: number; rate: number }>> {
    return Promise.all(
      tariffs.map(async (tariff) => {
        const result = await this.convert(tariff.amount, tariff.currency, targetCurrency);
        return {
          original: tariff.amount,
          originalCurrency: tariff.currency,
          converted: result.converted,
          rate: result.rate,
        };
      })
    );
  }

  /**
   * Warm up cache for common currencies
   */
  async warmUpCache(): Promise<void> {
    const commonCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'SGD'];

    console.log('Warming up FX rate cache...');

    for (const currency of commonCurrencies) {
      try {
        await this.fetchLiveRates(currency);
        console.log(`Cached rates for ${currency}`);
      } catch (error) {
        console.error(`Failed to cache rates for ${currency}:`, error);
      }
    }

    console.log('FX rate cache warm-up complete');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    cachedCurrencies: string[];
    oldestCache: number | null;
    newestCache: number | null;
  }> {
    const supportedCurrencies = this.getSupportedCurrencies();
    const cachedCurrencies: string[] = [];
    let oldestCache: number | null = null;
    let newestCache: number | null = null;

    for (const currency of supportedCurrencies) {
      const rates = await this.getCachedRates(currency);
      if (rates) {
        cachedCurrencies.push(currency);

        if (!oldestCache || rates.timestamp < oldestCache) {
          oldestCache = rates.timestamp;
        }

        if (!newestCache || rates.timestamp > newestCache) {
          newestCache = rates.timestamp;
        }
      }
    }

    return {
      cachedCurrencies,
      oldestCache,
      newestCache,
    };
  }

  /**
   * Clear all cached rates
   */
  async clearCache(): Promise<void> {
    const supportedCurrencies = this.getSupportedCurrencies();

    for (const currency of supportedCurrencies) {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${currency}`;
      await getRedisClient().del(cacheKey);
    }

    console.log('FX rate cache cleared');
  }
}

export const currencyService = new CurrencyService();
