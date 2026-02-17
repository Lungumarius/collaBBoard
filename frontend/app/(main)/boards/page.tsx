'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';
import { useWhiteboardStore } from '@/app/store/whiteboardStore';
import { apiClient } from '@/app/lib/api';
import BoardCard from '@/app/components/BoardCard';
import { Board } from '@/app/types';

export default function BoardsPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { boards, loading, error, setError, fetchBoards, createBoard, deleteBoard } = useWhiteboardStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardIsPublic, setNewBoardIsPublic] = useState(false);
  const [showPublicBoards, setShowPublicBoards] = useState(false);
  const [publicBoards, setPublicBoards] = useState<Board[]>([]);
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      router.push('/login');
      return;
    }
    fetchBoards().catch((err) => {
      console.error('Failed to fetch boards:', err);
      setError(err.message || 'Failed to load boards');
    });
  }, [isAuthenticated, accessToken, router, fetchBoards]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      router.push('/login');
      return;
    }

    try {
      const board = await createBoard({
        name: newBoardName,
        description: newBoardDescription,
        isPublic: newBoardIsPublic,
      });
      setShowCreateModal(false);
      setNewBoardName('');
      setNewBoardDescription('');
      setNewBoardIsPublic(false);
      router.push(`/boards/${board.id}`);
    } catch (err: any) {
      console.error('Failed to create board:', err);
      alert('Failed to create board: ' + (err.message || 'Unknown error'));
    }
  };

  const confirmDeleteBoard = async () => {
    if (!accessToken || !boardToDelete) return;

    try {
      await deleteBoard(boardToDelete);
      setShowDeleteModal(false);
      setBoardToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete board:', err);
      alert('Failed to delete board: ' + (err.message || 'Unknown error'));
    }
  };

  const openDeleteModal = (boardId: string) => {
    if (!accessToken) {
      router.push('/login');
      return;
    }
    setBoardToDelete(boardId);
    setShowDeleteModal(true);
  };

  const currentUser = useAuthStore((state) => state.user);

  const handleLoadPublicBoards = async () => {
    try {
      const publicBoardsList = await apiClient.getPublicBoards();
      setPublicBoards(publicBoardsList);
      setShowPublicBoards(true);
    } catch (err: any) {
      console.error('Failed to load public boards:', err);
      alert('Failed to load public boards: ' + (err.message || 'Unknown error'));
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">My Whiteboards</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {currentUser?.firstName}</span>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/login');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
          >
            + Create New Board
          </button>
          <button
            onClick={handleLoadPublicBoards}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
          >
            📋 Browse Public Boards
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading boards...</p>
          </div>
        )}

        {/* Public Boards Section */}
        {showPublicBoards && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Public Boards</h2>
              <button
                onClick={() => setShowPublicBoards(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Hide
              </button>
            </div>
            {publicBoards.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No public boards available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {publicBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    onDelete={undefined}
                    canDelete={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Boards Section */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">My Boards</h2>
        </div>

        {/* Boards Grid */}
        {!loading && boards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No boards yet. Create your first board!</p>
          </div>
        )}

        {!loading && boards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onDelete={openDeleteModal}
                canDelete={board.ownerId === currentUser?.id}
              />
            ))}
          </div>
        )}

        {/* Create Board Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Board</h2>
              <form onSubmit={handleCreateBoard}>
                <div className="mb-4">
                  <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-2">
                    Board Name *
                  </label>
                  <input
                    id="boardName"
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="My Whiteboard"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="boardDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="boardDescription"
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Optional description..."
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newBoardIsPublic}
                      onChange={(e) => setNewBoardIsPublic(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Make this board public (anyone can view it)
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewBoardName('');
                      setNewBoardDescription('');
                      setNewBoardIsPublic(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                  >
                    Create Board
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all scale-100">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Board?</h3>
              <p className="text-gray-500 text-center mb-6">
                Are you sure you want to delete this board? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteBoard}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors"
                >
                  Yes, Delete It
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
