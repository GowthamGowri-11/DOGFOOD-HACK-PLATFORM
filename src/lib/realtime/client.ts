import { RealtimeEvent, RealtimeEventType, ServerMessage, ClientMessage } from '@/server/realtime/event-types';

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
export type RealtimeEventHandler<T = any> = (event: RealtimeEvent<T>) => void;

export interface RealtimeClientOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
  maxReconnectAttempts?: number;
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
}

export class ApexRealtimeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token?: string;
  private status: ConnectionStatus = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private initialReconnectDelay: number;
  private maxReconnectDelay: number;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private subscribedRooms: Set<string> = new Set();
  private eventHandlers: Map<string, Set<RealtimeEventHandler>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private onReconnectCallbacks: Set<() => void> = new Set();

  constructor(options: RealtimeClientOptions = {}) {
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 6;
    this.initialReconnectDelay = options.initialReconnectDelay ?? 3000;
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30000;
    this.token = options.token;

    if (options.url) {
      this.url = options.url;
    } else if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${window.location.hostname}:3001`;
      this.url = host;
    } else {
      this.url = 'ws://localhost:3001';
    }

    if (options.autoConnect && typeof window !== 'undefined') {
      this.connect();
    }
  }

  public setToken(token: string) {
    this.token = token;
    if (this.status === 'CONNECTED' && this.ws) {
      this.send({ action: 'auth', token });
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;

    this.setStatus('CONNECTING');

    try {
      const connectUrl = this.token
        ? `${this.url}?token=${encodeURIComponent(this.token)}`
        : this.url;

      this.ws = new WebSocket(connectUrl);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        const wasReconnecting = this.reconnectAttempts > 0;
        this.reconnectAttempts = 0;

        // If authenticated token exists and wasn't sent via URL
        if (this.token) {
          this.send({ action: 'auth', token: this.token });
        }

        // Rejoin all desired rooms
        for (const room of Array.from(this.subscribedRooms)) {
          this.send({ action: 'join', room });
        }

        // Heartbeat ping from client every 25s
        this.startPing();

        // If reconnecting, trigger state re-synchronization callbacks
        if (wasReconnecting) {
          this.notifyReconnect();
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch {
          // Ignore malformed message
        }
      };

      this.ws.onclose = () => {
        this.cleanup();
        this.setStatus('DISCONNECTED');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // WebSocket error triggers onclose
      };
    } catch {
      this.setStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  private handleServerMessage(msg: ServerMessage) {
    if (msg.type === 'EVENT' && msg.event) {
      const event = msg.event;

      // 1. Specific event type listeners
      const specific = this.eventHandlers.get(event.type);
      if (specific) {
        for (const handler of Array.from(specific)) {
          try {
            handler(event);
          } catch (err) {
            console.error('[ApexRealtimeClient] Error in event handler:', err);
          }
        }
      }

      // 2. Wildcard event listeners
      const wildcard = this.eventHandlers.get('*');
      if (wildcard) {
        for (const handler of Array.from(wildcard)) {
          try {
            handler(event);
          } catch (err) {
            console.error('[ApexRealtimeClient] Error in wildcard handler:', err);
          }
        }
      }
    }
  }

  public subscribeToRoom(room: string): void {
    this.subscribedRooms.add(room);
    if (this.status === 'CONNECTED' && this.ws) {
      this.send({ action: 'join', room });
    }
  }

  public unsubscribeFromRoom(room: string): void {
    this.subscribedRooms.delete(room);
    if (this.status === 'CONNECTED' && this.ws) {
      this.send({ action: 'leave', room });
    }
  }

  public on<T = any>(eventType: RealtimeEventType | '*', handler: RealtimeEventHandler<T>): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler as RealtimeEventHandler);

    return () => {
      this.off(eventType, handler);
    };
  }

  public off<T = any>(eventType: RealtimeEventType | '*', handler: RealtimeEventHandler<T>): void {
    const set = this.eventHandlers.get(eventType);
    if (set) {
      set.delete(handler as RealtimeEventHandler);
      if (set.size === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }

  public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public onReconnect(callback: () => void): () => void {
    this.onReconnectCallbacks.add(callback);
    return () => {
      this.onReconnectCallbacks.delete(callback);
    };
  }

  private notifyReconnect(): void {
    for (const cb of Array.from(this.onReconnectCallbacks)) {
      try {
        cb();
      } catch (err) {
        console.error('[ApexRealtimeClient] Error in onReconnect callback:', err);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[ApexRealtimeClient] Max reconnect attempts reached. Waiting for manual trigger.');
      return;
    }

    if (this.reconnectTimer) return;

    // Exponential backoff: min(initialDelay * 2^attempts, maxDelay) with jitter
    const delay = Math.min(
      this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 500,
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.status === 'CONNECTED' && this.ws) {
        this.send({ action: 'ping' });
      }
    }, 25000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of Array.from(this.statusListeners)) {
      try {
        listener(status);
      } catch (err) {
        console.error('[ApexRealtimeClient] Error in status listener:', err);
      }
    }
  }

  private cleanup(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws = null;
    }
  }

  public disconnect(): void {
    this.cleanup();
    this.setStatus('DISCONNECTED');
  }
}

// Global client singleton
let globalRealtimeClient: ApexRealtimeClient | null = null;

export function getRealtimeClient(): ApexRealtimeClient {
  if (!globalRealtimeClient) {
    globalRealtimeClient = new ApexRealtimeClient({ autoConnect: true });
  }
  return globalRealtimeClient;
}
