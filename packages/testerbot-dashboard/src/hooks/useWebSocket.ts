import { useEffect, useState, useCallback, useRef } from 'react';
import type { TestRun, TestResult } from '../types';

interface WebSocketMessage {
  type: 'test:start' | 'test:complete' | 'test:result' | 'run:complete' | 'stats:update';
  payload: unknown;
}

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { url = 'ws://localhost:3011', autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'test:start':
              setCurrentRun(message.payload as TestRun);
              break;
            case 'test:result':
              const result = message.payload as TestResult;
              setRecentResults(prev => [result, ...prev.slice(0, 99)]);
              setCurrentRun(prev => prev ? {
                ...prev,
                results: [...prev.results, result],
                passed: prev.passed + (result.status === 'passed' ? 1 : 0),
                failed: prev.failed + (result.status === 'failed' ? 1 : 0),
                skipped: prev.skipped + (result.status === 'skipped' ? 1 : 0),
              } : null);
              break;
            case 'run:complete':
              setCurrentRun(prev => prev ? { ...prev, status: 'completed', endTime: new Date() } : null);
              break;
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (autoConnect) connect();
        }, 3000);
      };

      ws.onerror = (e) => {
        setError('WebSocket connection error');
        console.error('WebSocket error:', e);
      };
    } catch (e) {
      setError('Failed to connect to WebSocket');
      console.error('WebSocket connection failed:', e);
    }
  }, [url, autoConnect]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((type: string, payload: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    currentRun,
    recentResults,
    error,
    connect,
    disconnect,
    sendMessage,
  };
}
