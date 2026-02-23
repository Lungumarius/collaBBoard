'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';
import { useWhiteboardStore } from '@/app/store/whiteboardStore';
import WhiteboardCanvas from '@/app/components/WhiteboardCanvas';
import ColdStartLoader from '@/app/components/ColdStartLoader';

export default function BoardViewPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { currentBoard, shapes, loading, error, setError, fetchBoard, fetchShapes, resetBoard } = useWhiteboardStore();
  const [shapesLoaded, setShapesLoaded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.push('/login');
      return;
    }

    if (boardId) {
      // Always fetch fresh data on mount, even if store has something (could be stale)
      fetchBoard(boardId)
        .then(() => {
          return fetchShapes(boardId);
        })
        .then(() => {
          setShapesLoaded(true);
        })
        .catch((err) => {
          console.error('Failed to load board:', err);
          setError(err.message || 'Failed to load board');
        });
    }

    return () => {
      resetBoard();
    };
  }, [boardId, isAuthenticated, accessToken, router, fetchBoard, fetchShapes, resetBoard]);

  if (!isAuthenticated) {
    return null;
  }

  // Show loader while fetching board data OR shapes
  if (loading || !currentBoard || !shapesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg-light">
        <div className="glass-panel p-8 rounded-2xl shadow-xl">
          <ColdStartLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg-light">
        <div className="glass-panel p-8 rounded-2xl shadow-xl text-center">
          <p className="text-red-600 text-lg mb-4 font-medium">{error}</p>
          <button
            onClick={() => router.push('/boards')}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/boards')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{currentBoard.name}</h1>
          {currentBoard.description && (
            <span className="text-sm text-gray-500">{currentBoard.description}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {currentBoard.isPublic && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
              Public
            </span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <WhiteboardCanvas
        boardId={boardId}
        token={accessToken}
        shapes={shapes}
      />
    </div>
  );
}
