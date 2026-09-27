'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketEvent<T = any> {
  type: string;
  channel?: string;
  data?: T;
  timestamp?: number;
  message?: string;
}

export function useWebSocket(channels: string[] = ['general', 'announcements', 'leaderboard']) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const [notifications, setNotifications] = useState<WebSocketEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef<Map<string, Set<(event: WebSocketEvent) => void>>>(new Map());

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      const wsUrl = `${protocol}//${host}:3001`;

      setStatus('connecting');
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        // Subscribe to requested channels
        channels.forEach((ch) => {
          ws.send(JSON.stringify({ type: 'SUBSCRIBE', channel: ch }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WebSocketEvent = JSON.parse(event.data);
          setLastMessage(parsed);

          // Add to notifications queue if it's an announcement or alert
          if (parsed.type === 'ANNOUNCEMENT' || parsed.type === 'ALERT' || parsed.type === 'SCORE_UPDATE') {
            setNotifications((prev) => [parsed, ...prev.slice(0, 9)]);
          }

          // Trigger registered channel listeners
          const channelListeners = listenersRef.current.get(parsed.channel || parsed.type);
          if (channelListeners) {
            channelListeners.forEach((fn) => fn(parsed));
          }

          // Also trigger wildcard listeners
          const allListeners = listenersRef.current.get('*');
          if (allListeners) {
            allListeners.forEach((fn) => fn(parsed));
          }
        } catch {
          // Ignore unparseable frames
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        socketRef.current = null;
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        setStatus('error');
      };
    } catch {
      setStatus('error');
    }
  }, [channels]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Subscribe to specific channel/type
  const subscribe = useCallback((channel: string, callback: (event: WebSocketEvent) => void) => {
    if (!listenersRef.current.has(channel)) {
      listenersRef.current.set(channel, new Set());
    }
    listenersRef.current.get(channel)!.add(callback);

    // If socket is open, tell server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'SUBSCRIBE', channel }));
    }

    return () => {
      listenersRef.current.get(channel)?.delete(callback);
    };
  }, []);

  // Send message over WebSocket
  const send = useCallback((payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  // Clear a notification
  const dismissNotification = useCallback((index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    status,
    lastMessage,
    notifications,
    subscribe,
    send,
    dismissNotification,
  };
}
