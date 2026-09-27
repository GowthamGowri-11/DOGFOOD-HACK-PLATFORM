import crypto from 'crypto';
import { RealtimeEvent, RealtimeEventType } from './event-types';

export type RealtimeEventListener = (event: RealtimeEvent) => void | Promise<void>;

export class RealtimeEventBus {
  private static instance: RealtimeEventBus;
  private listeners: Map<string, Set<RealtimeEventListener>> = new Map();
  private wsBroadcaster: ((rooms: string[], event: RealtimeEvent) => void) | null = null;

  private constructor() {}

  public static getInstance(): RealtimeEventBus {
    if (!RealtimeEventBus.instance) {
      RealtimeEventBus.instance = new RealtimeEventBus();
    }
    return RealtimeEventBus.instance;
  }

  /**
   * Register a broadcaster function (e.g. from the WebSocket server)
   */
  public registerWebSocketBroadcaster(broadcaster: (rooms: string[], event: RealtimeEvent) => void) {
    this.wsBroadcaster = broadcaster;
  }

  /**
   * Subscribe to specific event types or all events ('*')
   */
  public subscribe(eventType: RealtimeEventType | '*', listener: RealtimeEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    return () => {
      this.unsubscribe(eventType, listener);
    };
  }

  /**
   * Unsubscribe a listener
   */
  public unsubscribe(eventType: RealtimeEventType | '*', listener: RealtimeEventListener): void {
    const set = this.listeners.get(eventType);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Publish an event after DB transaction has successfully committed.
   */
  public async publish<T = any>(params: {
    type: RealtimeEventType;
    rooms: string[];
    payload: T;
    hackathonId?: string;
    teamId?: string;
    projectId?: string;
    userId?: string;
    actorId?: string;
  }): Promise<RealtimeEvent<T>> {
    const event: RealtimeEvent<T> = {
      eventId: crypto.randomUUID ? crypto.randomUUID() : `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: params.type,
      timestamp: new Date().toISOString(),
      hackathonId: params.hackathonId,
      teamId: params.teamId,
      projectId: params.projectId,
      userId: params.userId,
      actorId: params.actorId,
      rooms: params.rooms,
      payload: params.payload,
    };

    try {
      // 1. Notify WebSocket broadcaster across authorized target rooms
      if (this.wsBroadcaster && event.rooms.length > 0) {
        this.wsBroadcaster(event.rooms, event);
      }

      // 2. Dispatch to typed listeners
      const typeListeners = this.listeners.get(event.type);
      if (typeListeners) {
        for (const listener of Array.from(typeListeners)) {
          try {
            await listener(event);
          } catch (err) {
            console.error(`[RealtimeEventBus] Error in typed listener for ${event.type}:`, err);
          }
        }
      }

      // 3. Dispatch to wildcard listeners ('*')
      const wildcardListeners = this.listeners.get('*');
      if (wildcardListeners) {
        for (const listener of Array.from(wildcardListeners)) {
          try {
            await listener(event);
          } catch (err) {
            console.error(`[RealtimeEventBus] Error in wildcard listener:`, err);
          }
        }
      }
    } catch (err) {
      console.error('[RealtimeEventBus] Error publishing event:', err);
    }

    return event;
  }

  /**
   * Clear all listeners (useful for testing)
   */
  public clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = RealtimeEventBus.getInstance();
