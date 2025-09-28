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
  type: 'text' | 'shape' | 'arrow' | 'line' | 'mermaid';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  layer?: number;
  selected?: boolean;
  style?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    fontFamily?: string;
    strokeWidth?: number;
    opacity?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  points?: { x: number; y: number }[];
  mermaidCode?: string;
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
  isActive?: boolean;
}

export interface ShareLink {
  id: string;
  whiteboardId: string;
  permission: 'viewer' | 'commenter' | 'editor';
  expiresAt?: string;
  createdAt: string;
}