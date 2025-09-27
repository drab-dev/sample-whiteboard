import { useEffect, useRef, useState } from 'react';
import { Whiteboard, ActiveUser, CanvasObject } from '../types';

interface WebSocketHooks {
  onWhiteboardUpdate?: (whiteboard: Whiteboard) => void;
  onActiveUsersUpdate?: (users: ActiveUser[]) => void;
  onObjectUpdate?: (object: CanvasObject) => void;
  onObjectCreate?: (object: CanvasObject) => void;
  onObjectDelete?: (objectId: string) => void;
}

interface WebSocketMessage {
  type: string;
  whiteboardId: string;
  data?: any;
}

export const useWebSocket = (whiteboardId: string, hooks: WebSocketHooks) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = () => {
    try {
      // Get auth token from cookie
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('authToken='))
        ?.split('=')[1];

      if (!authToken) {
        console.error('No auth token found');
        return;
      }

      const wsUrl = `ws://localhost:3001`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Join the whiteboard room
        sendMessage({
          type: 'join',
          whiteboardId,
          data: { token: authToken }
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 5) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const handleMessage = (message: any) => {
    switch (message.type) {
      case 'joined':
        if (hooks.onWhiteboardUpdate && message.data.whiteboard) {
          hooks.onWhiteboardUpdate(message.data.whiteboard);
        }
        if (hooks.onActiveUsersUpdate && message.data.activeUsers) {
          hooks.onActiveUsersUpdate(message.data.activeUsers);
        }
        break;

      case 'user_joined':
      case 'user_left':
      case 'cursor_update':
        // Handle active users update
        break;

      case 'object_create':
        if (hooks.onObjectCreate && message.data.object) {
          hooks.onObjectCreate(message.data.object);
        }
        break;

      case 'object_update':
        if (hooks.onObjectUpdate && message.data.object) {
          hooks.onObjectUpdate(message.data.object);
        }
        break;

      case 'object_delete':
        if (hooks.onObjectDelete && message.data.objectId) {
          hooks.onObjectDelete(message.data.objectId);
        }
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [whiteboardId]);

  return {
    isConnected,
    sendMessage
  };
};