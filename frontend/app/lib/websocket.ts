import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WebSocketMessage, WebSocketMessageType } from '@/app/types';

// Deduce WebSocket URL from API URL if not explicitly provided
const getWsUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  // Fallback: Use API URL but append /ws
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    // If API URL is http(s)://backend.com/api, we likely want http(s)://backend.com/ws
    // Or if it's just the root http(s)://backend.com, then /ws
    
    // Remove trailing slash
    const cleanUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // If URL ends with /api, remove it to get root
    const rootUrl = cleanUrl.endsWith('/api') ? cleanUrl.slice(0, -4) : cleanUrl;
    
    return `${rootUrl}/ws`;
  }
  
  return 'http://localhost:8081/ws';
};

const WS_URL = getWsUrl();

class WebSocketClient {
  private client: Client | null = null;
  private boardId: string | null = null;

  connect(boardId: string, token: string, callbacks: {
    onShapeEvent?: (message: WebSocketMessage) => void;
    onCursorEvent?: (message: WebSocketMessage) => void;
    onPresenceEvent?: (message: WebSocketMessage) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
  }) {
    if (this.client?.active) {
      this.disconnect();
    }

    this.boardId = boardId;

    const socket = new SockJS(WS_URL);
    this.client = new Client({
      webSocketFactory: () => socket as any,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('STOMP:', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('WebSocket connected');

        // Subscribe to shape events
        this.client?.subscribe(`/topic/board/${boardId}/shapes`, (message) => {
          const event: WebSocketMessage = JSON.parse(message.body);
          callbacks.onShapeEvent?.(event);
        });

        // Subscribe to cursor events
        this.client?.subscribe(`/topic/board/${boardId}/cursors`, (message) => {
          const event: WebSocketMessage = JSON.parse(message.body);
          callbacks.onCursorEvent?.(event);
        });

        // Subscribe to presence events
        this.client?.subscribe(`/topic/board/${boardId}/presence`, (message) => {
          const event: WebSocketMessage = JSON.parse(message.body);
          callbacks.onPresenceEvent?.(event);
        });

        callbacks.onConnect?.();
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        callbacks.onDisconnect?.();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        callbacks.onError?.(new Error(frame.headers['message'] || 'WebSocket error'));
      },
    });

    this.client.activate();
  }

  sendShapeCreate(data: {
    boardId: string;
    shapeType: string;
    shapeData: Record<string, any>;
    layerOrder?: number;
  }) {
    if (!this.client?.active) return;

    const message: WebSocketMessage = {
      type: WebSocketMessageType.SHAPE_CREATE,
      boardId: data.boardId,
      shapeType: data.shapeType as any,
      shapeData: data.shapeData,
      layerOrder: data.layerOrder,
    };

    this.client.publish({
      destination: '/app/shape/create',
      body: JSON.stringify(message),
    });
  }

  sendShapeUpdate(data: {
    boardId: string;
    shapeId: string;
    shapeData?: Record<string, any>;
    layerOrder?: number;
  }) {
    if (!this.client?.active) return;

    const message: WebSocketMessage = {
      type: WebSocketMessageType.SHAPE_UPDATE,
      boardId: data.boardId,
      shapeId: data.shapeId,
      shapeData: data.shapeData,
      layerOrder: data.layerOrder,
    };

    this.client.publish({
      destination: '/app/shape/update',
      body: JSON.stringify(message),
    });
  }

  sendShapeDelete(data: { boardId: string; shapeId: string }) {
    if (!this.client?.active) return;

    const message: WebSocketMessage = {
      type: WebSocketMessageType.SHAPE_DELETE,
      boardId: data.boardId,
      shapeId: data.shapeId,
    };

    this.client.publish({
      destination: '/app/shape/delete',
      body: JSON.stringify(message),
    });
  }

  sendCursorMove(boardId: string, x: number, y: number) {
    if (!this.client?.active) return;

    const message: WebSocketMessage = {
      type: WebSocketMessageType.CURSOR_MOVE,
      boardId,
      cursor: { x, y },
    };

    this.client.publish({
      destination: '/app/cursor/move',
      body: JSON.stringify(message),
    });
  }

  disconnect() {
    if (this.client?.active) {
      this.client.deactivate();
    }
    this.client = null;
    this.boardId = null;
  }

  isConnected(): boolean {
    return this.client?.active ?? false;
  }
}

export const wsClient = new WebSocketClient();
