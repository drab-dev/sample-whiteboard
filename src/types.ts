export interface User {
  id: string;
  email: string;
  name: string;
  organization_id: string;
}

export interface Whiteboard {
  id: string;
  title: string;
  owner_id: string;
  organization_id: string;
  content: WhiteboardContent;
  created_at: string;
  updated_at: string;
  collaborators?: Collaborator[];
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

export interface Collaborator {
  name: string;
  email: string;
  permission: 'viewer' | 'commenter' | 'editor';
}

export interface ActiveUser {
  id: string;
  name: string;
  cursor: { x: number; y: number };
  color: string;
}