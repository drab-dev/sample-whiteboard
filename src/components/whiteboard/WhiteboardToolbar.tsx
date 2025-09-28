import React, { useState } from 'react';
import { 
  MousePointer, Type, Square, Circle, ArrowRight, Undo, Redo, Trash2,
  Palette, Eye, Minus, Bold, Italic, Underline, GitBranch
} from 'lucide-react';

interface WhiteboardToolbarProps {
  selectedTool: 'select' | 'text' | 'rect' | 'circle' | 'arrow' | 'pen' | 'mermaid';
  onToolChange: (tool: 'select' | 'text' | 'rect' | 'circle' | 'arrow' | 'pen' | 'mermaid') => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  selectedFillColor: string;
  onFillColorChange: (color: string) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;
  textStyle: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
  onTextStyleChange: (style: { bold?: boolean; italic?: boolean; underline?: boolean }) => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
}

export const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({
  selectedTool,
  onToolChange,
  selectedColor,
  onColorChange,
  selectedFillColor,
  onFillColorChange,
  opacity,
  onOpacityChange,
  strokeWidth,
  onStrokeWidthChange,
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
  textStyle,
  onTextStyleChange,
  onDeleteSelected,
  hasSelection
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);

  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select' },
    { id: 'pen' as const, icon: Minus, label: 'Pen' },
    { id: 'text' as const, icon: Type, label: 'Text' },
    { id: 'rect' as const, icon: Square, label: 'Rectangle' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
    { id: 'arrow' as const, icon: ArrowRight, label: 'Arrow' },
    { id: 'mermaid' as const, icon: GitBranch, label: 'Mermaid Diagram' }
  ];

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000',
    '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0', '#FFFFFF'
  ];

  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 
    'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Pacifico', 'Roboto', 'Open Sans',
    'Lato', 'Montserrat', 'Poppins', 'Playfair Display', 'Dancing Script'
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center space-x-4 flex-wrap">
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

        {/* Colors */}
        <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center space-x-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Stroke Color"
            >
              <Palette size={16} />
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: selectedColor }}
              />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onColorChange(color);
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFillColorPicker(!showFillColorPicker)}
              className="flex items-center space-x-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Fill Color"
            >
              <Square size={16} />
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: selectedFillColor }}
              />
            </button>
            {showFillColorPicker && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        onFillColorChange(color);
                        setShowFillColorPicker(false);
                      }}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
          <label className="text-sm text-gray-600">Width:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-gray-600 min-w-[20px]">{strokeWidth}</span>
        </div>

        {/* Opacity */}
        <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
          <Eye size={16} className="text-gray-600" />
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-gray-600 min-w-[30px]">{Math.round(opacity * 100)}%</span>
        </div>

        {/* Text Controls (show only when text tool is selected) */}
        {selectedTool === 'text' && (
          <>
            <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
              <select
                value={fontFamily}
                onChange={(e) => onFontFamilyChange(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {fontFamilies.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
              <input
                type="number"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
              />
              <span className="text-sm text-gray-600">px</span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => onTextStyleChange({ bold: !textStyle.bold })}
                className={`p-1 rounded ${textStyle.bold ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button
                onClick={() => onTextStyleChange({ italic: !textStyle.italic })}
                className={`p-1 rounded ${textStyle.italic ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Italic"
              >
                <Italic size={16} />
              </button>
              <button
                onClick={() => onTextStyleChange({ underline: !textStyle.underline })}
                className={`p-1 rounded ${textStyle.underline ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Underline"
              >
                <Underline size={16} />
              </button>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-auto">
          {hasSelection && (
            <button
              onClick={onDeleteSelected}
              className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
              title="Delete Selected"
            >
              <Trash2 size={20} />
            </button>
          )}
          
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