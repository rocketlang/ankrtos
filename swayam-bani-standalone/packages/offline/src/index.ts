/**
 * SWAYAM Offline Support
 *
 * Provides offline-first capabilities for low connectivity areas
 *
 * Features:
 * - IndexedDB for local storage
 * - Request queue for deferred sync
 * - Network quality detection
 * - Progressive model loading
 *
 * @package @swayam/offline
 * @version 1.0.0
 */

// ============================================================================
// Types
// ============================================================================

export type NetworkQuality = 'offline' | '2g' | '3g' | '4g' | 'wifi';

export interface PendingOperation {
  id: string;
  type: 'message' | 'memory' | 'document' | 'feedback';
  action: 'create' | 'update' | 'delete';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  remaining: number;
  errors: Array<{ id: string; error: string }>;
}

export interface OfflineConfig {
  dbName: string;
  syncIntervalMs: number;
  maxRetries: number;
  maxQueueSize: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  size: number;
  url: string;
  priority: 'essential' | 'recommended' | 'optional';
  loadTrigger: 'immediate' | 'on-wifi' | 'on-demand';
}

// ============================================================================
// IndexedDB Store
// ============================================================================

const DB_VERSION = 1;
const STORES = {
  QUEUE: 'pendingQueue',
  CACHE: 'responseCache',
  MODELS: 'offlineModels',
  CONVERSATIONS: 'conversations',
  MEMORIES: 'memories',
};

export class OfflineStore {
  private db: IDBDatabase | null = null;
  private config: OfflineConfig;

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = {
      dbName: 'swayam-offline',
      syncIntervalMs: 30000,
      maxRetries: 5,
      maxQueueSize: 100,
      ...config,
    };
  }

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Pending operations queue
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          const queueStore = db.createObjectStore(STORES.QUEUE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp');
          queueStore.createIndex('type', 'type');
        }

        // Response cache
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt');
        }

        // Offline models
        if (!db.objectStoreNames.contains(STORES.MODELS)) {
          db.createObjectStore(STORES.MODELS, { keyPath: 'id' });
        }

        // Local conversations
        if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
          const convStore = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'id' });
          convStore.createIndex('updatedAt', 'updatedAt');
        }

        // Local memories
        if (!db.objectStoreNames.contains(STORES.MEMORIES)) {
          const memStore = db.createObjectStore(STORES.MEMORIES, { keyPath: 'id' });
          memStore.createIndex('type', 'type');
        }
      };
    });
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullOperation: PendingOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: operation.maxRetries || this.config.maxRetries,
    };

    await this.put(STORES.QUEUE, fullOperation);
    return id;
  }

  /**
   * Get pending operations
   */
  async getPendingOperations(): Promise<PendingOperation[]> {
    return this.getAll(STORES.QUEUE);
  }

  /**
   * Remove operation from queue
   */
  async removeOperation(id: string): Promise<void> {
    await this.delete(STORES.QUEUE, id);
  }

  /**
   * Update operation retry count
   */
  async updateRetryCount(id: string): Promise<void> {
    const op = await this.get<PendingOperation>(STORES.QUEUE, id);
    if (op) {
      op.retryCount++;
      await this.put(STORES.QUEUE, op);
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(key: string, data: unknown, ttlMs: number = 3600000): Promise<void> {
    await this.put(STORES.CACHE, {
      key,
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Get cached response
   */
  async getCachedResponse<T>(key: string): Promise<T | null> {
    const cached = await this.get<{ key: string; data: T; expiresAt: number }>(STORES.CACHE, key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    return null;
  }

  /**
   * Store conversation locally
   */
  async storeConversation(conversation: { id: string; messages: unknown[]; updatedAt: number }): Promise<void> {
    await this.put(STORES.CONVERSATIONS, conversation);
  }

  /**
   * Get local conversations
   */
  async getConversations(): Promise<Array<{ id: string; messages: unknown[]; updatedAt: number }>> {
    return this.getAll(STORES.CONVERSATIONS);
  }

  /**
   * Store memory locally
   */
  async storeMemory(memory: { id: string; type: string; key: string; value: unknown }): Promise<void> {
    await this.put(STORES.MEMORIES, memory);
  }

  /**
   * Get local memories
   */
  async getMemories(type?: string): Promise<Array<{ id: string; type: string; key: string; value: unknown }>> {
    const all = await this.getAll<{ id: string; type: string; key: string; value: unknown }>(STORES.MEMORIES);
    if (type) {
      return all.filter((m) => m.type === type);
    }
    return all;
  }

  // ==========================================================================
  // Generic IndexedDB operations
  // ==========================================================================

  private async put(store: string, data: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(store, 'readwrite');
      tx.objectStore(store).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async get<T>(store: string, key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(store, 'readonly');
      const request = tx.objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAll<T>(store: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(store, 'readonly');
      const request = tx.objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(store: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

// ============================================================================
// Network Quality Detection
// ============================================================================

export class NetworkDetector {
  private listeners: Array<(quality: NetworkQuality) => void> = [];
  private currentQuality: NetworkQuality = 'wifi';

  constructor() {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      this.setupListeners();
    }
  }

  /**
   * Get current network quality
   */
  getQuality(): NetworkQuality {
    if (typeof navigator === 'undefined') return 'wifi';

    if (!navigator.onLine) return 'offline';

    const connection = (navigator as any).connection;
    if (!connection) return 'wifi';

    const effectiveType = connection.effectiveType;
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return '2g';
      case '3g':
        return '3g';
      case '4g':
        return '4g';
      default:
        return connection.type === 'wifi' ? 'wifi' : '4g';
    }
  }

  /**
   * Check if offline
   */
  isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
  }

  /**
   * Subscribe to network changes
   */
  onChange(callback: (quality: NetworkQuality) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private setupListeners(): void {
    window.addEventListener('online', () => this.notifyChange());
    window.addEventListener('offline', () => this.notifyChange());

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => this.notifyChange());
    }
  }

  private notifyChange(): void {
    const quality = this.getQuality();
    if (quality !== this.currentQuality) {
      this.currentQuality = quality;
      for (const listener of this.listeners) {
        listener(quality);
      }
    }
  }
}

// ============================================================================
// Sync Manager
// ============================================================================

export class SyncManager {
  private store: OfflineStore;
  private network: NetworkDetector;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  constructor(store: OfflineStore, network: NetworkDetector) {
    this.store = store;
    this.network = network;
  }

  /**
   * Start automatic sync
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      this.stopAutoSync();
    }

    // Sync when coming online
    this.network.onChange((quality) => {
      if (quality !== 'offline') {
        this.syncNow();
      }
    });

    // Periodic sync
    this.syncInterval = setInterval(() => {
      if (!this.network.isOffline()) {
        this.syncNow();
      }
    }, intervalMs);

    console.log('[SyncManager] Auto-sync started');
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync now
   */
  async syncNow(): Promise<SyncResult> {
    if (this.isSyncing || this.network.isOffline()) {
      return { success: false, synced: 0, failed: 0, remaining: 0, errors: [] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      remaining: 0,
      errors: [],
    };

    try {
      const operations = await this.store.getPendingOperations();

      for (const op of operations) {
        if (op.retryCount >= op.maxRetries) {
          result.errors.push({ id: op.id, error: 'Max retries exceeded' });
          await this.store.removeOperation(op.id);
          result.failed++;
          continue;
        }

        try {
          const response = await fetch(op.endpoint, {
            method: op.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(op.data),
          });

          if (response.ok) {
            await this.store.removeOperation(op.id);
            result.synced++;
          } else {
            await this.store.updateRetryCount(op.id);
            result.failed++;
          }
        } catch (error: any) {
          await this.store.updateRetryCount(op.id);
          result.errors.push({ id: op.id, error: error.message });
          result.failed++;
        }
      }

      const remaining = await this.store.getPendingOperations();
      result.remaining = remaining.length;
    } finally {
      this.isSyncing = false;
    }

    console.log(`[SyncManager] Sync complete: ${result.synced} synced, ${result.failed} failed`);
    return result;
  }

  /**
   * Get pending count
   */
  async getPendingCount(): Promise<number> {
    const operations = await this.store.getPendingOperations();
    return operations.length;
  }
}

// ============================================================================
// Network-Aware Service Configuration
// ============================================================================

export interface ServiceConfig {
  stt: 'sarvam' | 'whisper-local' | 'vosk-local';
  tts: 'sarvam' | 'piper-local' | 'espeak-local';
  llm: 'groq' | 'gemini' | 'claude' | 'phi-local' | 'none';
  vision: 'gemini' | 'tesseract-local' | 'none';
}

export const NETWORK_SERVICE_CONFIG: Record<NetworkQuality, ServiceConfig> = {
  offline: {
    stt: 'whisper-local',
    tts: 'piper-local',
    llm: 'phi-local',
    vision: 'tesseract-local',
  },
  '2g': {
    stt: 'whisper-local',
    tts: 'piper-local',
    llm: 'groq', // Fast API
    vision: 'tesseract-local',
  },
  '3g': {
    stt: 'sarvam',
    tts: 'sarvam',
    llm: 'groq',
    vision: 'tesseract-local',
  },
  '4g': {
    stt: 'sarvam',
    tts: 'sarvam',
    llm: 'groq',
    vision: 'gemini',
  },
  wifi: {
    stt: 'sarvam',
    tts: 'sarvam',
    llm: 'groq',
    vision: 'gemini',
  },
};

export function getServiceConfig(quality: NetworkQuality): ServiceConfig {
  return NETWORK_SERVICE_CONFIG[quality];
}

// ============================================================================
// Offline Models Registry
// ============================================================================

export const OFFLINE_MODELS: ModelConfig[] = [
  // Essential - load immediately
  {
    id: 'piper-hindi',
    name: 'Piper TTS Hindi',
    size: 20_000_000,
    url: '/models/piper-hindi.onnx',
    priority: 'essential',
    loadTrigger: 'immediate',
  },
  {
    id: 'tesseract-core',
    name: 'Tesseract OCR Core',
    size: 5_000_000,
    url: '/models/tesseract-core.wasm',
    priority: 'essential',
    loadTrigger: 'immediate',
  },

  // Recommended - load on WiFi
  {
    id: 'whisper-tiny',
    name: 'Whisper Tiny STT',
    size: 39_000_000,
    url: '/models/whisper-tiny.onnx',
    priority: 'recommended',
    loadTrigger: 'on-wifi',
  },
  {
    id: 'vosk-hindi',
    name: 'Vosk Hindi STT',
    size: 50_000_000,
    url: '/models/vosk-hindi.zip',
    priority: 'recommended',
    loadTrigger: 'on-wifi',
  },
  {
    id: 'tesseract-hindi',
    name: 'Tesseract Hindi OCR',
    size: 15_000_000,
    url: '/models/tesseract-hindi.traineddata',
    priority: 'recommended',
    loadTrigger: 'on-wifi',
  },

  // Optional - load on demand
  {
    id: 'phi-3-mini',
    name: 'Phi-3 Mini LLM',
    size: 2_200_000_000,
    url: '/models/phi-3-mini.gguf',
    priority: 'optional',
    loadTrigger: 'on-demand',
  },
];

// ============================================================================
// Factory Functions
// ============================================================================

let offlineInstance: {
  store: OfflineStore;
  network: NetworkDetector;
  sync: SyncManager;
} | null = null;

export async function initOfflineSupport(config?: Partial<OfflineConfig>): Promise<{
  store: OfflineStore;
  network: NetworkDetector;
  sync: SyncManager;
}> {
  if (offlineInstance) return offlineInstance;

  const store = new OfflineStore(config);
  await store.init();

  const network = new NetworkDetector();
  const sync = new SyncManager(store, network);

  offlineInstance = { store, network, sync };
  console.log('[Offline] Support initialized');

  return offlineInstance;
}

export function getOfflineSupport(): {
  store: OfflineStore;
  network: NetworkDetector;
  sync: SyncManager;
} | null {
  return offlineInstance;
}

export default {
  OfflineStore,
  NetworkDetector,
  SyncManager,
  initOfflineSupport,
  getOfflineSupport,
  getServiceConfig,
  OFFLINE_MODELS,
};
