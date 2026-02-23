'use client';

import { Board } from '@/app/types';
import Link from 'next/link';
import React from 'react';

interface BoardCardProps {
  board: Board;
  onDelete?: (boardId: string) => void;
  canDelete?: boolean;
}

export default function BoardCard({ board, onDelete, canDelete = false }: BoardCardProps) {
  return (
    <div className="group relative">
      {/* Delete Button - Positioned outside the link to prevent navigation */}
      {canDelete && onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(board.id);
          }}
          className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-red-500 bg-white/50 hover:bg-white rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md"
          title="Delete Board"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      <Link href={`/boards/${board.id}`}>
        <div className="glass-panel h-full rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-white/60 bg-white/40 flex flex-col relative overflow-hidden">
          
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/30 group-hover:to-indigo-50/30 transition-colors duration-300 pointer-events-none"></div>

          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
              🎨
            </div>
            
            {board.isPublic ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50/80 px-2 py-1 rounded-md border border-emerald-100/50 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Public
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50/80 px-2 py-1 rounded-md border border-gray-100/50 uppercase tracking-wider">
                Private
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors relative z-10">
            {board.name}
          </h3>
          
          <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow font-medium leading-relaxed relative z-10">
            {board.description || 'No description provided.'}
          </p>

          <div className="mt-auto pt-4 border-t border-gray-100/50 flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Updated {new Date(board.updatedAt || board.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
              Open Board →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
