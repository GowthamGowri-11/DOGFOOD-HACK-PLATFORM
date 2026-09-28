'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRealtimeContext } from './RealtimeContext';
import { RealtimeEvent, RealtimeEventType, RealtimeRoomBuilder } from '@/server/realtime/event-types';

export function useRealtime() {
  return useRealtimeContext();
}

/**
 * Hook to listen for a specific Realtime event type.
 */
export function useRealtimeEvent<T = any>(
  eventType: RealtimeEventType | '*',
  handler: (event: RealtimeEvent<T>) => void,
  deps: any[] = []
) {
  const { on } = useRealtimeContext();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  useEffect(() => {
    const unsub = on<T>(eventType, (event) => {
      if (handlerRef.current) {
        handlerRef.current(event);
      }
    });

    return () => {
      unsub();
    };
  }, [eventType, on]);
}

/**
 * Hook to automatically subscribe to a Hackathon room (and optionally organizer room)
 * and receive live event updates.
 */
export function useRealtimeHackathon(
  hackathonId: string | undefined,
  onEvent?: (event: RealtimeEvent) => void,
  options: { isOrganizer?: boolean } = {}
) {
  const { subscribeToRoom, unsubscribeFromRoom, on, client } = useRealtimeContext();
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!hackathonId) return;

    const publicRoom = RealtimeRoomBuilder.hackathon(hackathonId);
    subscribeToRoom(publicRoom);

    let organizerRoom: string | null = null;
    if (options.isOrganizer) {
      organizerRoom = RealtimeRoomBuilder.organizer(hackathonId);
      subscribeToRoom(organizerRoom);
    }

    const unsub = on('*', (event) => {
      if (event.hackathonId === hackathonId || event.rooms.includes(publicRoom) || (organizerRoom && event.rooms.includes(organizerRoom))) {
        if (onEventRef.current) {
          onEventRef.current(event);
        }
      }
    });

    return () => {
      unsubscribeFromRoom(publicRoom);
      if (organizerRoom) {
        unsubscribeFromRoom(organizerRoom);
      }
      unsub();
    };
  }, [hackathonId, options.isOrganizer, subscribeToRoom, unsubscribeFromRoom, on]);
}

/**
 * Hook to subscribe to a specific Team room.
 */
export function useRealtimeTeam(teamId: string | undefined, onEvent?: (event: RealtimeEvent) => void) {
  const { subscribeToRoom, unsubscribeFromRoom, on } = useRealtimeContext();
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!teamId) return;

    const room = RealtimeRoomBuilder.team(teamId);
    subscribeToRoom(room);

    const unsub = on('*', (event) => {
      if (event.teamId === teamId || event.rooms.includes(room)) {
        if (onEventRef.current) {
          onEventRef.current(event);
        }
      }
    });

    return () => {
      unsubscribeFromRoom(room);
      unsub();
    };
  }, [teamId, subscribeToRoom, unsubscribeFromRoom, on]);
}

/**
 * Hook to subscribe to live judging progress for an organizer dashboard.
 */
export function useRealtimeJudging(hackathonId: string | undefined, onProgress?: (event: RealtimeEvent) => void) {
  const { subscribeToRoom, unsubscribeFromRoom, on } = useRealtimeContext();
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    if (!hackathonId) return;

    const organizerRoom = RealtimeRoomBuilder.organizer(hackathonId);
    subscribeToRoom(organizerRoom);

    const unsub = on('*', (event) => {
      if (
        event.type === 'EVALUATION_STARTED' ||
        event.type === 'EVALUATION_UPDATED' ||
        event.type === 'EVALUATION_COMPLETED' ||
        event.type === 'AI_JURY_PROGRESS' ||
        event.type === 'AI_JURY_COMPLETED'
      ) {
        if (event.hackathonId === hackathonId && onProgressRef.current) {
          onProgressRef.current(event);
        }
      }
    });

    return () => {
      unsubscribeFromRoom(organizerRoom);
      unsub();
    };
  }, [hackathonId, subscribeToRoom, unsubscribeFromRoom, on]);
}

/**
 * Hook to subscribe to user private notifications.
 */
export function useRealtimeNotifications(userId: string | undefined, onNotification?: (event: RealtimeEvent) => void) {
  const { subscribeToRoom, unsubscribeFromRoom, on } = useRealtimeContext();
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!userId) return;

    const room = RealtimeRoomBuilder.user(userId);
    subscribeToRoom(room);

    const unsub = on('NOTIFICATION_CREATED', (event) => {
      if (event.userId === userId && onNotificationRef.current) {
        onNotificationRef.current(event);
      }
    });

    return () => {
      unsubscribeFromRoom(room);
      unsub();
    };
  }, [userId, subscribeToRoom, unsubscribeFromRoom, on]);
}
