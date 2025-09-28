import React from 'react';
import { X, ChevronUp, ChevronDown, SkipForward, SkipBack, Eye, EyeOff } from 'lucide-react';
import { CanvasObject } from '../../types';

interface LayersPanelProps {
  objects: CanvasObject[];
  selectedObject: string | null;
  onSelectObject: (id: string) => void;
  onLayerChange: (objectId: string, direction: 'forward' | 'backward' | 'front' | 'back') => void;
  onClose: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  objects,
  selectedObject,
  onSelectObject,
  onLayerChange,
  onClose
}) => {
  const sortedObjects = [...objects].sort((a, b) => (b.layer || 0) - (a.layer || 0));

  const getObjectIcon = (obj: CanvasObject) => {
    switch (obj.type) {
      case 'text':
        return '📝';
      case 'shape':
        return obj.content === 'circle' ? '⭕' : '⬜';
      case 'arrow':
        return '➡️';
      case 'line':
        return '📏';
      case 'mermaid':
        return '📊';
      default:
        return '🔷';
    }
  };

  const getObjectName = (obj: CanvasObject) => {
    if (obj.type === 'text') {
      return obj.content?.substring(0, 20) + (obj.content && obj.content.length > 20 ? '...' : '') || 'Text';
    }
    if (obj.type === 'shape') {
      return obj.content === 'circle' ? 'Circle' : 'Rectangle';
    }
    if (obj.type === 'mermaid') {
      return obj.content || 'Mermaid Diagram';
    }
    return obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 shadow-lg flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Layers</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sortedObjects.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No objects on canvas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedObjects.map((obj, index) => (
              <div
                key={obj.id}
                className={`group flex items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedObject === obj.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onSelectObject(obj.id)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-lg mr-3">{getObjectIcon(obj)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getObjectName(obj)}
                    </p>
                    <p className="text-xs text-gray-500">Layer {obj.layer || 0}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerChange(obj.id, 'front');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Bring to Front"
                  >
                    <SkipForward size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerChange(obj.id, 'forward');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Bring Forward"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerChange(obj.id, 'backward');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Send Backward"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLayerChange(obj.id, 'back');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    title="Send to Back"
                  >
                    <SkipBack size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};