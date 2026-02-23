'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/store/authStore';
import { useWhiteboardStore } from '@/app/store/whiteboardStore';
import { apiClient } from '@/app/lib/api';
import BoardCard from '@/app/components/BoardCard';
import { Board } from '@/app/types';
import ColdStartLoader from '@/app/components/ColdStartLoader';
import Logo from '@/app/components/Logo';

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

  if (loading && boards.length === 0 && !showPublicBoards) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg-light">
        <ColdStartLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-bg-light text-gray-800">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-panel border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 transform hover:scale-105 transition-transform duration-300">
             <Logo className="w-8 h-8" withText={true} />
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-gray-600 hidden sm:block">
              {currentUser?.firstName} {currentUser?.lastName}
            </span>
            <button
              onClick={() => {
                useAuthStore.getState().logout();
                router.push('/login');
              }}
              className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors bg-gray-100/50 hover:bg-red-50 px-3 py-1.5 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 animate-float" style={{animationDuration: '10s'}}>
        
        {/* Welcome Section */}
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 mb-2 tracking-tight">
            Your Workspace
          </h2>
          <p className="text-lg text-gray-500 font-medium">Manage your boards and collaborations.</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-10 flex flex-wrap gap-4 justify-center sm:justify-start">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition duration-200 shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center gap-2 transform hover:-translate-y-1"
          >
            <span className="text-xl leading-none">+</span> New Board
          </button>
          <button
            onClick={handleLoadPublicBoards}
            className="bg-white/60 hover:bg-white border border-gray-200 text-gray-700 font-bold px-6 py-3 rounded-xl transition duration-200 flex items-center gap-2 shadow-sm hover:shadow-md backdrop-blur-sm"
          >
            Explore Public Gallery
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/90 backdrop-blur-md border border-red-100 text-red-600 px-6 py-4 rounded-2xl mb-8 text-sm font-medium shadow-sm flex items-center gap-3">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        {/* Public Boards Section */}
        {showPublicBoards && (
          <div className="mb-16 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🌍</span> Public Gallery
              </h3>
              <button
                onClick={() => setShowPublicBoards(false)}
                className="text-sm font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Close Gallery
              </button>
            </div>
            {publicBoards.length === 0 ? (
              <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No public boards found in the archives.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        {/* Boards Grid */}
        {!loading && boards.length === 0 && !showPublicBoards && (
          <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-300 shadow-sm mx-auto max-w-2xl">
            <div className="text-6xl mb-6 opacity-80 animate-bounce">🎨</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Tabula Rasa</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
              The canvas is blank. Start something chaotic and beautiful.
            </p>
            <button
               onClick={() => setShowCreateModal(true)}
               className="text-blue-600 font-bold hover:text-blue-700 hover:underline decoration-2 underline-offset-4 transition-colors"
            >
              Create your first board →
            </button>
          </div>
        )}

        {!loading && boards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
