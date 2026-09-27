import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifySessionToken } from '../auth/session';
import { ResourceGuards } from '../permissions/resource-guards';
import { UserSession } from '../../types';
import { RealtimeEvent, ClientMessage, ServerMessage } from './event-types';
import { eventBus } from './event-bus';

interface AuthenticatedSocket extends WebSocket {
  isAlive: boolean;
  session?: UserSession;
  rooms: Set<string>;
  messageCount: number;
  lastMessageReset: number;
}

export class ApexWebSocketServer {
  private wss: WebSocketServer | null = null;
  private roomSubscribers: Map<string, Set<AuthenticatedSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(serverOrPort?: any) {
    if (serverOrPort) {
      this.init(serverOrPort);
    }
  }

  public init(serverOrPort: any) {
    if (this.wss) return;

    try {
      if (typeof serverOrPort === 'number') {
        this.wss = new WebSocketServer({ port: serverOrPort });
      } else {
        this.wss = new WebSocketServer({ server: serverOrPort });
      }

      this.wss.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`[ApexWebSocketServer] Port ${serverOrPort} is already bound, reusing active listener.`);
        } else {
          console.error('[ApexWebSocketServer] WebSocket server error:', err.message);
        }
      });

      this.setupServer();
      this.setupHeartbeat();

      // Register with Central Event Bus
      eventBus.registerWebSocketBroadcaster((rooms, event) => {
        this.broadcastToRooms(rooms, event);
      });

      console.log(`[ApexWebSocketServer] WebSocket server initialized on port ${typeof serverOrPort === 'number' ? serverOrPort : 'custom'}`);
    } catch (err: any) {
      console.log('[ApexWebSocketServer] Init notice:', err.message);
    }
  }

  private setupServer() {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const socket = ws as AuthenticatedSocket;
      socket.isAlive = true;
      socket.rooms = new Set();
      socket.messageCount = 0;
      socket.lastMessageReset = Date.now();

      // 1. Authenticate from request (Cookie header or Query parameter)
      const token = this.extractToken(req);
      if (token) {
        const session = verifySessionToken(token);
        if (session) {
          socket.session = session;
          // Automatically subscribe to user's private room
          this.joinRoom(socket, `user:${session.id}`);
          this.sendMessage(socket, { type: 'AUTH_SUCCESS', timestamp: new Date().toISOString() });
        }
      }

      // 2. Pong handler for heartbeat
      socket.on('pong', () => {
        socket.isAlive = true;
      });

      // 3. Message handler
      socket.on('message', async (data: Buffer | string) => {
        try {
          // Rate limiting (max 100 messages/min)
          const now = Date.now();
          if (now - socket.lastMessageReset > 60000) {
            socket.messageCount = 0;
            socket.lastMessageReset = now;
          }
          socket.messageCount++;
          if (socket.messageCount > 100) {
            this.sendMessage(socket, { type: 'ERROR', reason: 'Rate limit exceeded' });
            return;
          }

          const parsed: ClientMessage = JSON.parse(data.toString());
          await this.handleClientMessage(socket, parsed);
        } catch {
          this.sendMessage(socket, { type: 'ERROR', reason: 'Invalid JSON payload' });
        }
      });

      // 4. Disconnect & cleanup handler
      socket.on('close', () => {
        this.cleanupSocket(socket);
      });

      socket.on('error', (err) => {
        console.error('[ApexWebSocketServer] Socket error:', err);
        this.cleanupSocket(socket);
      });
    });
  }

  private extractToken(req: IncomingMessage): string | null {
    if (!req.url) return null;

    try {
      // 1. Query parameter ?token=...
      const url = new URL(req.url, 'http://localhost');
      const tokenParam = url.searchParams.get('token');
      if (tokenParam) return tokenParam;

      // 2. Cookie header
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map((c) => c.trim());
        for (const cookie of cookies) {
          if (cookie.startsWith('dogfood_session_token=')) {
            return cookie.substring('dogfood_session_token='.length);
          }
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  private async handleClientMessage(socket: AuthenticatedSocket, msg: ClientMessage) {
    if (msg.action === 'ping') {
      this.sendMessage(socket, { type: 'PONG', timestamp: new Date().toISOString() });
      return;
    }

    if (msg.action === 'auth') {
      if (msg.token) {
        const session = verifySessionToken(msg.token);
        if (session) {
          socket.session = session;
          this.joinRoom(socket, `user:${session.id}`);
          this.sendMessage(socket, { type: 'AUTH_SUCCESS', timestamp: new Date().toISOString() });
          return;
        }
      }
      this.sendMessage(socket, { type: 'AUTH_ERROR', reason: 'Invalid session token' });
      return;
    }

    if (msg.action === 'join') {
      if (!msg.room) {
        this.sendMessage(socket, { type: 'ERROR', reason: 'Room name is required' });
        return;
      }

      const isAuthorized = await this.verifyRoomAccess(socket, msg.room);
      if (isAuthorized) {
        this.joinRoom(socket, msg.room);
        this.sendMessage(socket, { type: 'ROOM_JOINED', room: msg.room });
      } else {
        this.sendMessage(socket, {
          type: 'ROOM_JOIN_DENIED',
          room: msg.room,
          reason: 'Unauthorized access to room',
        });
      }
      return;
    }

    if (msg.action === 'leave') {
      if (msg.room) {
        this.leaveRoom(socket, msg.room);
        this.sendMessage(socket, { type: 'ROOM_LEFT', room: msg.room });
      }
      return;
    }
  }

  /**
   * Server-side authorization check before a socket can subscribe to a room.
   */
  public async verifyRoomAccess(socket: AuthenticatedSocket, room: string): Promise<boolean> {
    const session = socket.session;
    if (!session) return false;

    // Platform Admins have access to all rooms
    if (session.role === 'ADMIN') return true;

    const [prefix, id] = room.split(':');
    if (!prefix || !id) return false;

    switch (prefix) {
      case 'user':
        // Only own user room
        return session.id === id;

      case 'hackathon':
        // Any authenticated participant, organizer, or judge
        return true;

      case 'organizer':
        // Must be the assigned organizer for this hackathon
        return ResourceGuards.canOrganizerAccessHackathon(session.id, id);

      case 'team':
        // Member of team or assigned organizer
        const isTeamMember = await ResourceGuards.canParticipantAccessTeam(session.id, id);
        if (isTeamMember) return true;
        return ResourceGuards.canOrganizerAccessTeam(session.id, id);

      case 'project':
        // Project team member, assigned judge, or assigned organizer
        const isProjectMember = await ResourceGuards.canParticipantAccessProject(session.id, id);
        if (isProjectMember) return true;
        const isAssignedJudge = await ResourceGuards.canJudgeAccessProject(session.id, id);
        if (isAssignedJudge) return true;
        return ResourceGuards.canOrganizerAccessProject(session.id, id);

      case 'judge':
        // Judge private room
        return session.id === id;

      case 'evaluation':
        // Evaluation owner judge only
        return ResourceGuards.canJudgeAccessEvaluation(session.id, id);

      default:
        return false;
    }
  }

  private joinRoom(socket: AuthenticatedSocket, room: string) {
    socket.rooms.add(room);
    if (!this.roomSubscribers.has(room)) {
      this.roomSubscribers.set(room, new Set());
    }
    this.roomSubscribers.get(room)!.add(socket);
  }

  private leaveRoom(socket: AuthenticatedSocket, room: string) {
    socket.rooms.delete(room);
    const roomSet = this.roomSubscribers.get(room);
    if (roomSet) {
      roomSet.delete(socket);
      if (roomSet.size === 0) {
        this.roomSubscribers.delete(room);
      }
    }
  }

  private cleanupSocket(socket: AuthenticatedSocket) {
    for (const room of Array.from(socket.rooms)) {
      this.leaveRoom(socket, room);
    }
  }

  private sendMessage(socket: AuthenticatedSocket, msg: ServerMessage) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  }

  /**
   * Broadcast an event to multiple rooms without duplicate delivery to clients subscribed to multiple matching rooms.
   */
  public broadcastToRooms(rooms: string[], event: RealtimeEvent) {
    const targetSockets = new Set<AuthenticatedSocket>();

    for (const room of rooms) {
      const subscribers = this.roomSubscribers.get(room);
      if (subscribers) {
        subscribers.forEach((socket) => {
          targetSockets.add(socket);
        });
      }
    }

    const payloadString = JSON.stringify({
      type: 'EVENT',
      event,
    });

    targetSockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payloadString);
      }
    });
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: WebSocket) => {
        const socket = ws as AuthenticatedSocket;
        if (!socket.isAlive) {
          this.cleanupSocket(socket);
          return socket.terminate();
        }

        socket.isAlive = false;
        socket.ping();
      });
    }, 30000);
  }

  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }

  public getSubscriberCount(room: string): number {
    return this.roomSubscribers.get(room)?.size || 0;
  }
}

// Global server instance holder
let globalWsServer: ApexWebSocketServer | null = null;

export function getWebSocketServer(portOrServer?: any): ApexWebSocketServer {
  if (!globalWsServer) {
    const target = portOrServer !== undefined ? portOrServer : (typeof process !== 'undefined' ? parseInt(process.env.WEBSOCKET_PORT || '3001', 10) : 3001);
    globalWsServer = new ApexWebSocketServer(target);
  }
  return globalWsServer;
}
