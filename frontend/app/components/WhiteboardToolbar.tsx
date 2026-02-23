'use client';

import { ShapeType } from '@/app/types';

interface WhiteboardToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  onColorChange: (color: string) => void;
  selectedColor?: string;
  onExport?: () => void;
  onTemplateSelect?: (template: string) => void;
  onResetBoard?: () => void;
}

export default function WhiteboardToolbar({
  selectedTool,
  onToolSelect,
  onColorChange,
  selectedColor = '#000000',
  onExport,
  onTemplateSelect,
  onResetBoard,
}: WhiteboardToolbarProps) {
  const tools = [
    { id: 'select', name: 'Select', icon: '↖️' },
    { id: 'pen', name: 'Pen', icon: '✏️' },
    { id: 'rectangle', name: 'Rectangle', icon: '▭' },
    { id: 'circle', name: 'Circle', icon: '○' },
    { id: 'text', name: 'Text', icon: 'T' },
    { id: 'arrow', name: 'Arrow', icon: '→' },
    { id: 'sticky', name: 'Sticky Note', icon: '📝' },
  ];

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
  ];

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-50">
      
      <div className="flex items-center gap-6">
        {/* Tools Group */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                selectedTool === tool.id
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
              title={tool.name}
            >
              <span className="text-xl block w-6 h-6 flex items-center justify-center leading-none">{tool.icon}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-gray-200"></div>

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {colors.slice(0, 5).map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-6 h-6 rounded-full border border-white ring-1 ring-gray-200 transition-transform hover:scale-110 hover:z-10 ${
                   selectedColor === color ? 'scale-110 z-10 ring-2 ring-offset-1 ring-blue-500' : ''
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="relative group">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-8 h-8 rounded-full overflow-hidden border-0 p-0 cursor-pointer opacity-0 absolute inset-0"
            />
            <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-xs text-gray-500 bg-gray-50 group-hover:bg-gray-100 transition-colors">
              +
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-8 w-px bg-gray-200"></div>

        {/* Templates */}
        {onTemplateSelect && (
          <select
            value="" // Force reset after selection
            onChange={(e) => onTemplateSelect(e.target.value)}
            className="text-sm bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer"
          >
            <option value="" disabled>Add Template...</option>
            <option value="brainstorming">Brainstorming</option>
            <option value="wireframe">Wireframe</option>
            <option value="mindmap">Mind Map</option>
          </select>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Reset Button */}
        {onResetBoard && (
          <button
            onClick={onResetBoard}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear Board"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        {/* Cloud Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
          Saved
        </div>

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all shadow-sm active:scale-[0.98]"
          >
            <span>Download</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
