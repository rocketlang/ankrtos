import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: 'icd-auth-token',
  FACILITY_ID: 'icd-facility-id',
  TENANT_ID: 'icd-tenant-id',
  OFFLINE_QUEUE: 'icd-offline-queue',
};

// In-memory cache for synchronous access (initialized from AsyncStorage)
let _token: string | null = null;
let _facilityId: string = '';
let _tenantId: string = 'default';

export function getStoredToken(): string | null { return _token; }
export function getStoredFacilityId(): string { return _facilityId; }
export function getStoredTenantId(): string { return _tenantId; }

export async function initStorage(): Promise<void> {
  const [token, facilityId, tenantId] = await Promise.all([
    AsyncStorage.getItem(KEYS.AUTH_TOKEN),
    AsyncStorage.getItem(KEYS.FACILITY_ID),
    AsyncStorage.getItem(KEYS.TENANT_ID),
  ]);
  _token = token;
  _facilityId = facilityId ?? '';
  _tenantId = tenantId ?? 'default';
}

export async function setToken(token: string | null): Promise<void> {
  _token = token;
  if (token) {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  } else {
    await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
  }
}

export async function setFacilityId(id: string): Promise<void> {
  _facilityId = id;
  await AsyncStorage.setItem(KEYS.FACILITY_ID, id);
}

export async function setTenantId(id: string): Promise<void> {
  _tenantId = id;
  await AsyncStorage.setItem(KEYS.TENANT_ID, id);
}

// Offline queue
export interface QueuedMutation {
  id: string;
  operationName: string;
  variables: Record<string, unknown>;
  timestamp: number;
}

export async function getOfflineQueue(): Promise<QueuedMutation[]> {
  const raw = await AsyncStorage.getItem(KEYS.OFFLINE_QUEUE);
  return raw ? JSON.parse(raw) : [];
}

export async function addToOfflineQueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push({
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
  });
  await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
}

export async function removeFromOfflineQueue(id: string): Promise<void> {
  const queue = await getOfflineQueue();
  const filtered = queue.filter((q) => q.id !== id);
  await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.OFFLINE_QUEUE);
}
