'use client';

import { ShapeType } from '@/app/types';

interface WhiteboardToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  onColorChange?: (color: string) => void;
  selectedColor?: string;
  onExport?: () => void;
  onTemplateSelect?: (template: string) => void;
}

export default function WhiteboardToolbar({
  selectedTool,
  onToolSelect,
  onColorChange,
  selectedColor = '#000000',
  onExport,
  onTemplateSelect,
}: WhiteboardToolbarProps) {
  const tools = [
    { id: 'select', name: 'Select', icon: '↖️' },
    { id: 'pen', name: 'Pen', icon: '✏️' },
    { id: 'rectangle', name: 'Rectangle', icon: '▭' },
    { id: 'circle', name: 'Circle', icon: '○' },
    { id: 'text', name: 'Text', icon: 'T' },
    { id: 'arrow', name: 'Arrow', icon: '→' },
    { id: 'line', name: 'Line', icon: '─' },
    { id: 'sticky', name: 'Sticky Note', icon: '📝' },
  ];

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#808080',
  ];

  const templates = [
    { id: 'brainstorming', name: 'Brainstorming' },
    { id: 'wireframe', name: 'Wireframe' },
    { id: 'mindmap', name: 'Mind Map' },
  ];

  return (
    <div className="bg-gray-800 text-white p-4 flex items-center gap-4 shadow-lg">
      {/* Tools */}
      <div className="flex items-center gap-2 border-r border-gray-600 pr-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className={`px-3 py-2 rounded-lg transition-all duration-200 ${
              selectedTool === tool.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
            title={tool.name}
          >
            <span className="text-lg">{tool.icon}</span>
          </button>
        ))}
      </div>

      {/* Color Picker */}
      {onColorChange && (
        <div className="flex items-center gap-2 border-r border-gray-600 pr-4">
          <label className="text-sm font-medium">Color:</label>
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className={`w-8 h-8 rounded border-2 ${
                  selectedColor === color ? 'border-white' : 'border-gray-500'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-8 h-8 rounded border border-gray-500 cursor-pointer"
          />
        </div>
      )}

      {/* Templates */}
      {onTemplateSelect && (
        <div className="flex items-center gap-2 border-r border-gray-600 pr-4">
          <label className="text-sm font-medium">Templates:</label>
          <select
            onChange={(e) => onTemplateSelect(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Export */}
      {onExport && (
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
          >
            Export
          </button>
        </div>
      )}
    </div>
  );
}
