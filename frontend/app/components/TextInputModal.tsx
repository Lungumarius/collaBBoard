'use client';

import { useState, useEffect, useRef } from 'react';

interface TextInputModalProps {
  isOpen: boolean;
  x: number;
  y: number;
  initialText?: string;
  placeholder?: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  canvasContainer?: HTMLElement | null;
}

export default function TextInputModal({
  isOpen,
  x,
  y,
  initialText = '',
  placeholder = 'Enter text...',
  onSave,
  onCancel,
  canvasContainer,
}: TextInputModalProps) {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      // Adjust position relative to canvas container if provided
      if (canvasContainer) {
        const rect = canvasContainer.getBoundingClientRect();
        setPosition({
          x: x + rect.left,
          y: y + rect.top,
        });
      } else {
        setPosition({ x, y });
      }
      // Focus input after a short delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
    }
  }, [isOpen, x, y, initialText, canvasContainer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      // Cmd/Ctrl + Enter to save
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
    } else {
      onCancel();
    }
  };

  const handleCancel = () => {
    setText('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 min-w-[300px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={4}
        autoFocus
      />
      <div className="flex gap-2 mt-3 justify-end">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          disabled={!text.trim()}
        >
          Save
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Cmd/Ctrl + Enter</kbd> to save, <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to cancel
      </p>
    </div>
  );
}
