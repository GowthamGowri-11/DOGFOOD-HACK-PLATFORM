'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApexRealtimeClient, ConnectionStatus, getRealtimeClient } from './client';
import { RealtimeEvent, RealtimeEventType } from '@/server/realtime/event-types';

interface RealtimeContextValue {
  status: ConnectionStatus;
  client: ApexRealtimeClient;
  subscribeToRoom: (room: string) => void;
  unsubscribeFromRoom: (room: string) => void;
  on: <T = any>(eventType: RealtimeEventType | '*', handler: (event: RealtimeEvent<T>) => void) => () => void;
  reconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState<ApexRealtimeClient>(() => getRealtimeClient());
  const [status, setStatus] = useState<ConnectionStatus>(client.getStatus());

  useEffect(() => {
    const unsub = client.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Attempt initial connect
    client.connect();

    return () => {
      unsub();
    };
  }, [client]);

  const value: RealtimeContextValue = {
    status,
    client,
    subscribeToRoom: (room: string) => client.subscribeToRoom(room),
    unsubscribeFromRoom: (room: string) => client.unsubscribeFromRoom(room),
    on: (eventType, handler) => client.on(eventType, handler),
    reconnect: () => client.connect(),
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeContext(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    // Return safe fallback if used outside provider (guarantees REST operation works even without provider)
    const client = getRealtimeClient();
    return {
      status: client.getStatus(),
      client,
      subscribeToRoom: () => {},
      unsubscribeFromRoom: () => {},
      on: () => () => {},
      reconnect: () => {},
    };
  }
  return ctx;
}
