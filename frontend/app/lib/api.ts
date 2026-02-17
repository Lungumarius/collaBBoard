import { Board, Shape, Collaborator, AuthResponse, LoginRequest, RegisterRequest } from '@/app/types';

// Client-side URLs (public/browser access via Nginx)
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || ''; 
const PUBLIC_AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || '';

// Server-side URLs (internal Docker network OR public fallback)
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || PUBLIC_API_URL || 'http://whiteboard-service:8081';
const INTERNAL_AUTH_API_URL = process.env.INTERNAL_AUTH_API_URL || PUBLIC_AUTH_API_URL || 'http://auth-service:8080';

// Helper to get the correct base URL based on environment
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return INTERNAL_API_URL;
  }
  return PUBLIC_API_URL;
};

const getAuthApiUrl = () => {
  if (typeof window === 'undefined') {
    return INTERNAL_AUTH_API_URL;
  }
  return PUBLIC_AUTH_API_URL;
};

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${getAuthApiUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }

      const authResponse = await response.json();
      
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', authResponse.accessToken);
        localStorage.setItem('refreshToken', authResponse.refreshToken);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
      }

      return authResponse;
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to connect to server. Please check if auth service is running.');
      }
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${getAuthApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }

      const authResponse = await response.json();
      
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', authResponse.accessToken);
        localStorage.setItem('refreshToken', authResponse.refreshToken);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
      }

      return authResponse;
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to connect to server. Please check if auth service is running.');
      }
      throw error;
    }
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Board endpoints
  async getBoards(): Promise<Board[]> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/boards`, {
        headers: this.getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        // Token expired or invalid - clear and redirect
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch boards' }));
        throw new Error(errorData.message || `Failed to fetch boards: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to connect to server. Please check if whiteboard service is running.');
      }
      throw error;
    }
  }

  async getBoard(boardId: string): Promise<Board> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}`, {
        headers: this.getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch board' }));
        throw new Error(errorData.message || `Failed to fetch board: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to connect to server. Please check if whiteboard service is running.');
      }
      throw error;
    }
  }

  async createBoard(data: { name: string; description?: string; isPublic?: boolean }): Promise<Board> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/boards`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (response.status === 401 || response.status === 403) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create board' }));
        throw new Error(errorData.message || `Failed to create board: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to connect to server. Please check if whiteboard service is running.');
      }
      throw error;
    }
  }

  async updateBoard(boardId: string, data: { name?: string; description?: string; isPublic?: boolean }): Promise<Board> {
    const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update board');
    }

    return response.json();
  }

  async deleteBoard(boardId: string): Promise<void> {
    const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete board');
    }
  }

  async getPublicBoards(): Promise<Board[]> {
    const response = await fetch(`${getApiBaseUrl()}/api/boards/public`);

    if (!response.ok) {
      throw new Error('Failed to fetch public boards');
    }

    return response.json();
  }

  // Shape endpoints
  async getShapes(boardId: string): Promise<Shape[]> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }

      const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}/shapes`, {
        headers: this.getHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch shapes' }));
        throw new Error(errorData.message || `Failed to fetch shapes: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Failed to connect to server. Please check if whiteboard service is running.');
      }
      throw error;
    }
  }

  async createShape(boardId: string, data: { type: string; data: Record<string, any>; layerOrder?: number }): Promise<Shape> {
    const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}/shapes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create shape');
    }

    return response.json();
  }

  async updateShape(boardId: string, shapeId: string, data: { data?: Record<string, any>; layerOrder?: number }): Promise<Shape> {
    const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}/shapes/${shapeId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update shape');
    }

    return response.json();
  }

  async deleteShape(boardId: string, shapeId: string): Promise<void> {
    const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}/shapes/${shapeId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete shape');
    }
  }

  // Collaborator endpoints
  async getCollaborators(boardId: string): Promise<Collaborator[]> {
    const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}/collaborators`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch collaborators');
    }

    return response.json();
  }

  async addCollaborator(boardId: string, data: { userId: string; role: string }): Promise<Collaborator> {
    const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}/collaborators`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to add collaborator');
    }

    return response.json();
  }

  async removeCollaborator(boardId: string, userId: string): Promise<void> {
    const response = await fetch(`${getApiBaseUrl()}/api/boards/${boardId}/collaborators/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to remove collaborator');
    }
  }
}

export const apiClient = new ApiClient();
