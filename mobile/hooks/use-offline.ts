import { useState, useEffect, useCallback } from 'react';
import { isOnline, replayOfflineQueue } from '@/lib/offline';
import { getOfflineQueue } from '@/lib/storage';

export function useOffline() {
  const [online, setOnline] = useState(true);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    const check = async () => {
      setOnline(await isOnline());
      const queue = await getOfflineQueue();
      setQueueLength(queue.length);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const syncNow = useCallback(async () => {
    const result = await replayOfflineQueue();
    const queue = await getOfflineQueue();
    setQueueLength(queue.length);
    return result;
  }, []);

  return { isOnline: online, queueLength, syncNow };
}
