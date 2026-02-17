// API Types
export interface Board {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shape {
  id: string;
  boardId: string;
  type: ShapeType;
  data: Record<string, any>;
  layerOrder: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ShapeType {
  PEN = 'PEN',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  TEXT = 'TEXT',
  STICKY_NOTE = 'STICKY_NOTE',
  ARROW = 'ARROW',
  LINE = 'LINE',
  TRIANGLE = 'TRIANGLE',
}

export enum CollaboratorRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export interface Collaborator {
  id: string;
  boardId: string;
  userId: string;
  role: CollaboratorRole;
  createdAt: string;
}

// WebSocket Types
export enum WebSocketMessageType {
  SHAPE_CREATE = 'SHAPE_CREATE',
  SHAPE_UPDATE = 'SHAPE_UPDATE',
  SHAPE_DELETE = 'SHAPE_DELETE',
  USER_JOIN = 'USER_JOIN',
  USER_LEAVE = 'USER_LEAVE',
  CURSOR_MOVE = 'CURSOR_MOVE',
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  boardId?: string;
  shapeId?: string;
  shapeType?: ShapeType;
  shapeData?: Record<string, any>;
  layerOrder?: number;
  userId?: string;
  userEmail?: string;
  cursor?: { x: number; y: number };
  timestamp?: number;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
