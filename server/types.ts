export interface User {
  id: string;
  email: string;
  name: string;
  organization_id: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Whiteboard {
  id: string;
  title: string;
  owner_id: string;
  organization_id: string;
  content: WhiteboardContent;
  created_at: string;
  updated_at: string;
}

export interface WhiteboardContent {
  objects: CanvasObject[];
  version: number;
}

export interface CanvasObject {
  id: string;
  type: 'text' | 'shape' | 'arrow' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  style?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    strokeWidth?: number;
  };
  points?: { x: number; y: number }[];
}

export interface WhiteboardPermission {
  id: string;
  whiteboard_id: string;
  user_id: string;
  permission: 'viewer' | 'commenter' | 'editor';
  created_at: string;
}

export interface Comment {
  id: string;
  whiteboard_id: string;
  user_id: string;
  content: string;
  x: number;
  y: number;
  created_at: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface WebSocketMessage {
  type: 'join' | 'leave' | 'cursor' | 'object_update' | 'object_create' | 'object_delete';
  whiteboardId: string;
  data?: any;
  userId?: string;
}

export interface ActiveUser {
  id: string;
  name: string;
  cursor: { x: number; y: number };
  color: string;
}