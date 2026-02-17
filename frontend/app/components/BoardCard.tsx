'use client';

import { Board } from '@/app/types';
import Link from 'next/link';

interface BoardCardProps {
  board: Board;
  onDelete?: (boardId: string) => void;
  canDelete?: boolean;
}

export default function BoardCard({ board, onDelete, canDelete }: BoardCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && canDelete) {
      onDelete(board.id);
    }
  };

  return (
    <Link href={`/boards/${board.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 p-6 border border-gray-200 hover:border-blue-300 cursor-pointer relative group">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-800 truncate flex-1">
            {board.name}
          </h3>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="ml-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete board"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {board.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {board.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {board.isPublic ? (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Public
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                Private
              </span>
            )}
          </div>
          <span className="text-xs">
            {new Date(board.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
