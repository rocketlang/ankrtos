import NetInfo from 'expo-network';
import { getApolloClient } from './apollo-client';
import { getOfflineQueue, removeFromOfflineQueue, type QueuedMutation } from './storage';
import { gql } from '@apollo/client';

// Simple mutation document map for replaying
const MUTATION_DOCS: Record<string, ReturnType<typeof gql>> = {};

export function registerOfflineMutation(name: string, doc: ReturnType<typeof gql>): void {
  MUTATION_DOCS[name] = doc;
}

export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.getNetworkStateAsync();
    return state.isConnected ?? false;
  } catch {
    return true; // Assume online if check fails (e.g., web)
  }
}

export async function replayOfflineQueue(): Promise<{ replayed: number; failed: number }> {
  const online = await isOnline();
  if (!online) return { replayed: 0, failed: 0 };

  const queue = await getOfflineQueue();
  if (queue.length === 0) return { replayed: 0, failed: 0 };

  const client = getApolloClient();
  let replayed = 0;
  let failed = 0;

  for (const item of queue) {
    const doc = MUTATION_DOCS[item.operationName];
    if (!doc) {
      // Unknown mutation, remove from queue
      await removeFromOfflineQueue(item.id);
      failed++;
      continue;
    }

    try {
      await client.mutate({ mutation: doc, variables: item.variables });
      await removeFromOfflineQueue(item.id);
      replayed++;
    } catch {
      failed++;
      // Leave in queue for next retry
    }
  }

  return { replayed, failed };
}
