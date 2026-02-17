'use client';

import { create } from 'zustand';
import { Board, Shape } from '@/app/types';
import { apiClient } from '@/app/lib/api';

interface WhiteboardState {
  boards: Board[];
  currentBoard: Board | null;
  shapes: Shape[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchBoards: () => Promise<void>;
  fetchBoard: (boardId: string) => Promise<void>;
  createBoard: (data: { name: string; description?: string; isPublic?: boolean }) => Promise<Board>;
  updateBoard: (boardId: string, data: { name?: string; description?: string; isPublic?: boolean }) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  fetchShapes: (boardId: string) => Promise<void>;
  setCurrentBoard: (board: Board | null) => void;
  setShapes: (shapes: Shape[]) => void;
  setError: (error: string | null) => void;
  addShape: (shape: Shape) => void;
  updateShape: (shapeId: string, data: Partial<Shape>) => void;
  removeShape: (shapeId: string) => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  shapes: [],
  loading: false,
  error: null,

  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const boards = await apiClient.getBoards();
      set({ boards, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchBoard: async (boardId: string) => {
    set({ loading: true, error: null });
    try {
      const board = await apiClient.getBoard(boardId);
      const shapes = await apiClient.getShapes(boardId);
      set({ currentBoard: board, shapes, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createBoard: async (data) => {
    set({ loading: true, error: null });
    try {
      const board = await apiClient.createBoard(data);
      set((state) => ({ boards: [board, ...state.boards], loading: false }));
      return board;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateBoard: async (boardId: string, data) => {
    set({ loading: true, error: null });
    try {
      await apiClient.updateBoard(boardId, data);
      const board = await apiClient.getBoard(boardId);
      set((state) => ({
        boards: state.boards.map((b) => (b.id === boardId ? board : b)),
        currentBoard: state.currentBoard?.id === boardId ? board : state.currentBoard,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteBoard: async (boardId: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.deleteBoard(boardId);
      set((state) => ({
        boards: state.boards.filter((b) => b.id !== boardId),
        currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchShapes: async (boardId: string) => {
    set({ loading: true, error: null });
    try {
      const shapes = await apiClient.getShapes(boardId);
      set({ shapes, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setCurrentBoard: (board) => set({ currentBoard: board }),

  setShapes: (shapes) => set({ shapes }),

  setError: (error) => set({ error }),

  addShape: (shape) => set((state) => ({ shapes: [...state.shapes, shape] })),

  updateShape: (shapeId, data) =>
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === shapeId ? { ...s, ...data } : s)),
    })),

  removeShape: (shapeId) =>
    set((state) => ({ shapes: state.shapes.filter((s) => s.id !== shapeId) })),
}));
