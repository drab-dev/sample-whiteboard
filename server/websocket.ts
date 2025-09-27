import { WebSocket, WebSocketServer } from 'ws';
import { AuthService } from './auth.js';
import { Database } from './database.js';
import { WebSocketMessage, ActiveUser } from './types.js';

export class WhiteboardWebSocket {
  private wss: WebSocketServer;
  private rooms: Map<string, Map<string, WebSocket & { userId?: string; whiteboardId?: string }>> = new Map();
  private activeUsers: Map<string, Map<string, ActiveUser>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket & { userId?: string; whiteboardId?: string }) => {
      console.log('WebSocket connection established');

      ws.on('message', async (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket & { userId?: string; whiteboardId?: string }, message: WebSocketMessage) {
    const { type, whiteboardId, data, userId } = message;

    switch (type) {
      case 'join':
        await this.handleJoin(ws, whiteboardId, data.token);
        break;

      case 'leave':
        this.handleLeave(ws);
        break;

      case 'cursor':
        this.handleCursor(ws, data);
        break;

      case 'object_update':
      case 'object_create':
      case 'object_delete':
        await this.handleObjectChange(ws, type, data);
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private async handleJoin(ws: WebSocket & { userId?: string; whiteboardId?: string }, whiteboardId: string, token: string) {
    try {
      // Verify token and get user
      const userId = await AuthService.verifyToken(token);
      if (!userId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
        return;
      }

      const user = await Database.getUserById(userId);
      if (!user) {
        ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
        return;
      }

      // Check whiteboard access
      const whiteboard = await Database.getWhiteboard(whiteboardId);
      if (whiteboard.owner_id !== userId) {
        const permission = await Database.getUserPermission(whiteboardId, userId);
        if (!permission) {
          ws.send(JSON.stringify({ type: 'error', message: 'Access denied' }));
          return;
        }
      }

      // Add to room
      ws.userId = userId;
      ws.whiteboardId = whiteboardId;

      if (!this.rooms.has(whiteboardId)) {
        this.rooms.set(whiteboardId, new Map());
        this.activeUsers.set(whiteboardId, new Map());
      }

      this.rooms.get(whiteboardId)!.set(userId, ws);

      // Add active user
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
      const activeUsersInRoom = this.activeUsers.get(whiteboardId)!;
      const userColor = colors[activeUsersInRoom.size % colors.length];

      activeUsersInRoom.set(userId, {
        id: userId,
        name: user.name,
        cursor: { x: 0, y: 0 },
        color: userColor
      });

      // Notify user joined
      ws.send(JSON.stringify({
        type: 'joined',
        data: {
          activeUsers: Array.from(activeUsersInRoom.values()),
          whiteboard: whiteboard
        }
      }));

      // Notify others of new user
      this.broadcastToRoom(whiteboardId, {
        type: 'user_joined',
        data: { user: activeUsersInRoom.get(userId) }
      }, userId);

    } catch (error) {
      console.error('Join error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to join' }));
    }
  }

  private handleLeave(ws: WebSocket & { userId?: string; whiteboardId?: string }) {
    if (ws.whiteboardId && ws.userId) {
      const room = this.rooms.get(ws.whiteboardId);
      const activeUsers = this.activeUsers.get(ws.whiteboardId);

      if (room) {
        room.delete(ws.userId);
      }

      if (activeUsers) {
        activeUsers.delete(ws.userId);
        
        // Notify others user left
        this.broadcastToRoom(ws.whiteboardId, {
          type: 'user_left',
          data: { userId: ws.userId }
        }, ws.userId);
      }

      // Clean up empty rooms
      if (room && room.size === 0) {
        this.rooms.delete(ws.whiteboardId);
        this.activeUsers.delete(ws.whiteboardId);
      }
    }
  }

  private handleCursor(ws: WebSocket & { userId?: string; whiteboardId?: string }, data: { x: number; y: number }) {
    if (!ws.whiteboardId || !ws.userId) return;

    const activeUsers = this.activeUsers.get(ws.whiteboardId);
    if (activeUsers && activeUsers.has(ws.userId)) {
      const user = activeUsers.get(ws.userId)!;
      user.cursor = { x: data.x, y: data.y };

      // Broadcast cursor position to others
      this.broadcastToRoom(ws.whiteboardId, {
        type: 'cursor_update',
        data: { userId: ws.userId, cursor: user.cursor }
      }, ws.userId);
    }
  }

  private async handleObjectChange(ws: WebSocket & { userId?: string; whiteboardId?: string }, type: string, data: any) {
    if (!ws.whiteboardId || !ws.userId) return;

    try {
      // Update database
      const whiteboard = await Database.getWhiteboard(ws.whiteboardId);
      const content = whiteboard.content;

      switch (type) {
        case 'object_create':
          content.objects.push(data.object);
          break;
        case 'object_update':
          const updateIndex = content.objects.findIndex(obj => obj.id === data.object.id);
          if (updateIndex !== -1) {
            content.objects[updateIndex] = { ...content.objects[updateIndex], ...data.object };
          }
          break;
        case 'object_delete':
          content.objects = content.objects.filter(obj => obj.id !== data.objectId);
          break;
      }

      content.version++;
      await Database.updateWhiteboardContent(ws.whiteboardId, content);

      // Broadcast to others in room
      this.broadcastToRoom(ws.whiteboardId, {
        type,
        data
      }, ws.userId);

    } catch (error) {
      console.error('Object change error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to update object' }));
    }
  }

  private handleDisconnect(ws: WebSocket & { userId?: string; whiteboardId?: string }) {
    this.handleLeave(ws);
  }

  private broadcastToRoom(whiteboardId: string, message: any, excludeUserId?: string) {
    const room = this.rooms.get(whiteboardId);
    if (!room) return;

    const messageString = JSON.stringify(message);
    
    room.forEach((client, userId) => {
      if (excludeUserId && userId === excludeUserId) return;
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }
}