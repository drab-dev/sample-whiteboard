import React from 'react';
import { MousePointer, Type, Square, Circle, ArrowRight, Undo, Redo } from 'lucide-react';

interface WhiteboardToolbarProps {
  selectedTool: 'select' | 'text' | 'rect' | 'circle' | 'arrow';
  onToolChange: (tool: 'select' | 'text' | 'rect' | 'circle' | 'arrow') => void;
}

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  selectedTool,
  onToolChange
}) => {
  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select' },
    { id: 'text' as const, icon: Type, label: 'Text' },
    { id: 'rect' as const, icon: Square, label: 'Rectangle' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
    { id: 'arrow' as const, icon: ArrowRight, label: 'Arrow' }
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center space-x-2">
        {/* Tools */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`p-2 rounded-lg transition-colors ${
                selectedTool === tool.id
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={tool.label}
            >
              <tool.icon size={20} />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
            title="Undo"
          >
            <Undo size={20} />
          </button>
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
            title="Redo"
          >
            <Redo size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};