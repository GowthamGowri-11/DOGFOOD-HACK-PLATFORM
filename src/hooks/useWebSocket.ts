'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketEvent<T = any> {
  type: string;
  channel?: string;
  data?: T;
  timestamp?: number;
  message?: string;
}

const DEFAULT_CHANNELS = ['general', 'announcements', 'leaderboard'];
const MAX_RETRIES = 3;

export function useWebSocket(channels: string[] = DEFAULT_CHANNELS, enabled: boolean = true) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const [notifications, setNotifications] = useState<WebSocketEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listenersRef = useRef<Map<string, Set<(event: WebSocketEvent) => void>>>(new Map());
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const hasConnectedRef = useRef(false);

  // Stabilize channels string to avoid re-triggering connect on every render
  const channelsKey = useMemo(() => channels.slice().sort().join(','), [channels]);
  const channelsList = useMemo(() => channelsKey.split(',').filter(Boolean), [channelsKey]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Stop retrying after MAX_RETRIES if we've never connected successfully
    if (!hasConnectedRef.current && retryCountRef.current >= MAX_RETRIES) {
      return;
    }

    // Prevent duplicate connections if already open or connecting
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${host}:3001`;

      if (isMountedRef.current) setStatus('connecting');
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus('connected');
        retryCountRef.current = 0;
        hasConnectedRef.current = true;

        // Subscribe to requested channels
        channelsList.forEach((ch) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'SUBSCRIBE', channel: ch }));
          }
        });
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const parsed: WebSocketEvent = JSON.parse(event.data);
          setLastMessage(parsed);

          if (parsed.type === 'ANNOUNCEMENT' || parsed.type === 'ALERT' || parsed.type === 'SCORE_UPDATE') {
            setNotifications((prev) => [parsed, ...prev.slice(0, 9)]);
          }

          const channelListeners = listenersRef.current.get(parsed.channel || parsed.type);
          if (channelListeners) {
            channelListeners.forEach((fn) => fn(parsed));
          }

          const allListeners = listenersRef.current.get('*');
          if (allListeners) {
            allListeners.forEach((fn) => fn(parsed));
          }
        } catch {
          // Ignore non-JSON frames
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setStatus('disconnected');
        socketRef.current = null;

        retryCountRef.current += 1;

        // Only retry if we haven't hit the limit, or if we previously connected successfully
        if (hasConnectedRef.current || retryCountRef.current < MAX_RETRIES) {
          const backoff = Math.min(2000 * Math.pow(2, retryCountRef.current), 30000);
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) connect();
          }, backoff);
        }
      };

      ws.onerror = () => {
        // onerror always fires before onclose — no need to set status here
      };
    } catch {
      if (isMountedRef.current) setStatus('disconnected');
    }
  }, [channelsList]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    retryCountRef.current = 0;
    hasConnectedRef.current = false;
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, enabled, disconnect]);

  // Subscribe to specific channel/type
  const subscribe = useCallback((channel: string, callback: (event: WebSocketEvent) => void) => {
    if (!listenersRef.current.has(channel)) {
      listenersRef.current.set(channel, new Set());
    }
    listenersRef.current.get(channel)!.add(callback);

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
