import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Layers, Users, Share2, Sparkles } from 'lucide-react';
import { Whiteboard, CanvasObject, ActiveUser } from '../../types';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { ActiveCollaborators } from './ActiveCollaborators';
import { LayersPanel } from './LayersPanel';
import { CollaborationPanel } from './CollaborationPanel';
import { AIPanel } from './AIPanel';
import { MermaidRenderer } from './MermaidRenderer';
import { useWebSocket } from '../../hooks/useWebSocket';
import { fabric } from 'fabric';

interface WhiteboardCanvasProps {
  whiteboardId: string;
  onBack: () => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  whiteboardId,
  onBack
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'rect' | 'circle' | 'arrow' | 'pen' | 'mermaid'>('select');
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  // Style states
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFillColor, setSelectedFillColor] = useState('#3B82F6');
  const [opacity, setOpacity] = useState(1);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textStyle, setTextStyle] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  const { sendMessage, isConnected } = useWebSocket(whiteboardId, {
    onWhiteboardUpdate: (updatedWhiteboard: Whiteboard) => {
      setWhiteboard(updatedWhiteboard);
      setObjects(updatedWhiteboard.content.objects);
      syncObjectsToCanvas(updatedWhiteboard.content.objects);
    },
    onActiveUsersUpdate: (users: ActiveUser[]) => {
      setActiveUsers(users);
    },
    onObjectUpdate: (object: CanvasObject) => {
      setObjects(prev => prev.map(obj => obj.id === object.id ? object : obj));
      updateFabricObject(object);
    },
    onObjectCreate: (object: CanvasObject) => {
      setObjects(prev => [...prev, object]);
      addFabricObject(object);
    },
    onObjectDelete: (objectId: string) => {
      setObjects(prev => prev.filter(obj => obj.id !== objectId));
      removeFabricObject(objectId);
    },
    onCursorUpdate: (userId: string, cursor: { x: number; y: number }) => {
      updateUserCursor(userId, cursor);
    }
  });

  useEffect(() => {
    fetchWhiteboard();
    initializeFabricCanvas();
    
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [whiteboardId]);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      setupCanvasEvents();
    }
  }, [selectedTool, selectedColor, selectedFillColor, strokeWidth, fontSize, fontFamily, textStyle]);

  const fetchWhiteboard = async () => {
    try {
      const response = await fetch(`/api/whiteboards/${whiteboardId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setWhiteboard(data);
        setObjects(data.content.objects || []);
      }
    } catch (error) {
      console.error('Failed to fetch whiteboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeFabricCanvas = () => {
    if (!canvasContainerRef.current) return;

    const canvas = new fabric.Canvas('whiteboard-canvas', {
      width: canvasContainerRef.current.clientWidth,
      height: canvasContainerRef.current.clientHeight,
      backgroundColor: '#ffffff',
      selection: selectedTool === 'select'
    });

    fabricCanvasRef.current = canvas;

    // Handle window resize
    const handleResize = () => {
      if (canvasContainerRef.current && fabricCanvasRef.current) {
        fabricCanvasRef.current.setDimensions({
          width: canvasContainerRef.current.clientWidth,
          height: canvasContainerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  const setupCanvasEvents = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.selection = selectedTool === 'select';
    canvas.defaultCursor = selectedTool === 'select' ? 'default' : 'crosshair';

    // Mouse events
    canvas.on('mouse:down', handleCanvasMouseDown);
    canvas.on('mouse:move', handleCanvasMouseMove);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);
  };

  const handleCanvasMouseDown = (e: fabric.IEvent) => {
    if (selectedTool === 'select') return;

    const pointer = fabricCanvasRef.current?.getPointer(e.e);
    if (!pointer) return;

    createCanvasObject(pointer.x, pointer.y);
  };

  const handleCanvasMouseMove = (e: fabric.IEvent) => {
    const pointer = fabricCanvasRef.current?.getPointer(e.e);
    if (!pointer) return;

    // Send cursor position to other users
    sendMessage({
      type: 'cursor',
      whiteboardId,
      data: { x: pointer.x, y: pointer.y }
    });
  };

  const handleObjectModified = (e: fabric.IEvent) => {
    const obj = e.target;
    if (!obj || !obj.data) return;

    const canvasObject: CanvasObject = {
      ...obj.data,
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.width ? obj.width * (obj.scaleX || 1) : undefined,
      height: obj.height ? obj.height * (obj.scaleY || 1) : undefined
    };

    sendMessage({
      type: 'object_update',
      whiteboardId,
      data: { object: canvasObject }
    });
  };

  const handleSelectionCreated = (e: fabric.IEvent) => {
    const obj = e.target;
    if (obj && obj.data) {
      setSelectedObject(obj.data.id);
    }
  };

  const handleSelectionCleared = () => {
    setSelectedObject(null);
  };

  const createCanvasObject = (x: number, y: number) => {
    const id = `obj_${Date.now()}_${Math.random()}`;
    let newObject: CanvasObject;

    switch (selectedTool) {
      case 'text':
        newObject = {
          id,
          type: 'text',
          x,
          y,
          content: 'Double click to edit',
          layer: objects.length,
          style: {
            color: selectedColor,
            fontSize,
            fontFamily,
            bold: textStyle.bold,
            italic: textStyle.italic,
            underline: textStyle.underline,
            opacity
          }
        };
        break;

      case 'rect':
        newObject = {
          id,
          type: 'shape',
          x,
          y,
          width: 100,
          height: 60,
          content: 'rectangle',
          layer: objects.length,
          style: {
            color: selectedColor,
            backgroundColor: selectedFillColor,
            strokeWidth,
            opacity
          }
        };
        break;

      case 'circle':
        newObject = {
          id,
          type: 'shape',
          x,
          y,
          width: 80,
          height: 80,
          content: 'circle',
          layer: objects.length,
          style: {
            color: selectedColor,
            backgroundColor: selectedFillColor,
            strokeWidth,
            opacity
          }
        };
        break;

      case 'arrow':
        newObject = {
          id,
          type: 'arrow',
          x,
          y,
          width: 100,
          height: 0,
          layer: objects.length,
          style: {
            color: selectedColor,
            strokeWidth,
            opacity
          }
        };
        break;

      default:
        return;
    }

    sendMessage({
      type: 'object_create',
      whiteboardId,
      data: { object: newObject }
    });
  };

  const addFabricObject = (obj: CanvasObject) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let fabricObj: fabric.Object;

    switch (obj.type) {
      case 'text':
        fabricObj = new fabric.IText(obj.content || '', {
          left: obj.x,
          top: obj.y,
          fontSize: obj.style?.fontSize || 16,
          fontFamily: obj.style?.fontFamily || 'Arial',
          fill: obj.style?.color || '#000000',
          fontWeight: obj.style?.bold ? 'bold' : 'normal',
          fontStyle: obj.style?.italic ? 'italic' : 'normal',
          underline: obj.style?.underline || false,
          opacity: obj.style?.opacity || 1
        });
        break;

      case 'shape':
        if (obj.content === 'rectangle') {
          fabricObj = new fabric.Rect({
            left: obj.x,
            top: obj.y,
            width: obj.width || 100,
            height: obj.height || 60,
            fill: obj.style?.backgroundColor || 'transparent',
            stroke: obj.style?.color || '#000000',
            strokeWidth: obj.style?.strokeWidth || 2,
            opacity: obj.style?.opacity || 1
          });
        } else {
          fabricObj = new fabric.Circle({
            left: obj.x,
            top: obj.y,
            radius: (obj.width || 80) / 2,
            fill: obj.style?.backgroundColor || 'transparent',
            stroke: obj.style?.color || '#000000',
            strokeWidth: obj.style?.strokeWidth || 2,
            opacity: obj.style?.opacity || 1
          });
        }
        break;

      case 'arrow':
        const points = [obj.x, obj.y, obj.x + (obj.width || 100), obj.y + (obj.height || 0)];
        fabricObj = new fabric.Line(points, {
          stroke: obj.style?.color || '#000000',
          strokeWidth: obj.style?.strokeWidth || 2,
          opacity: obj.style?.opacity || 1
        });
        break;

      default:
        return;
    }

    fabricObj.data = obj;
    fabricObj.selectable = selectedTool === 'select';
    canvas.add(fabricObj);
    canvas.renderAll();
  };

  const updateFabricObject = (obj: CanvasObject) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const fabricObj = canvas.getObjects().find(o => o.data?.id === obj.id);
    if (!fabricObj) return;

    fabricObj.set({
      left: obj.x,
      top: obj.y,
      width: obj.width,
      height: obj.height
    });

    fabricObj.data = obj;
    canvas.renderAll();
  };

  const removeFabricObject = (objectId: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const fabricObj = canvas.getObjects().find(o => o.data?.id === objectId);
    if (fabricObj) {
      canvas.remove(fabricObj);
      canvas.renderAll();
    }
  };

  const syncObjectsToCanvas = (objects: CanvasObject[]) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    objects.forEach(obj => addFabricObject(obj));
  };

  const updateUserCursor = (userId: string, cursor: { x: number; y: number }) => {
    setActiveUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, cursor } : user
    ));
  };

  const handleLayerChange = (objectId: string, direction: 'forward' | 'backward' | 'front' | 'back') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const fabricObj = canvas.getObjects().find(o => o.data?.id === objectId);
    if (!fabricObj) return;

    switch (direction) {
      case 'forward':
        canvas.bringForward(fabricObj);
        break;
      case 'backward':
        canvas.sendBackwards(fabricObj);
        break;
      case 'front':
        canvas.bringToFront(fabricObj);
        break;
      case 'back':
        canvas.sendToBack(fabricObj);
        break;
    }

    canvas.renderAll();
  };

  const handleDeleteSelected = () => {
    if (!selectedObject) return;

    sendMessage({
      type: 'object_delete',
      whiteboardId,
      data: { objectId: selectedObject }
    });
  };

  const handleAIGenerate = async (prompt: string, type: 'diagram' | 'mermaid') => {
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, type, whiteboardId }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (type === 'mermaid') {
          const newObject: CanvasObject = {
            id: `mermaid_${Date.now()}_${Math.random()}`,
            type: 'mermaid',
            x: 100,
            y: 100,
            width: 400,
            height: 300,
            content: data.title || 'AI Generated Diagram',
            mermaidCode: data.mermaidCode,
            layer: objects.length
          };

          sendMessage({
            type: 'object_create',
            whiteboardId,
            data: { object: newObject }
          });
        }
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  if (!whiteboard) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Whiteboard not found</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{whiteboard.title}</h1>
              <div className="flex items-center text-sm text-gray-500">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ActiveCollaborators users={activeUsers} />
            
            <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
              <button
                onClick={() => setShowLayersPanel(!showLayersPanel)}
                className={`p-2 rounded-lg transition-colors ${showLayersPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Layers"
              >
                <Layers size={20} />
              </button>
              
              <button
                onClick={() => setShowCollaborationPanel(!showCollaborationPanel)}
                className={`p-2 rounded-lg transition-colors ${showCollaborationPanel ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Collaboration"
              >
                <Share2 size={20} />
              </button>
              
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`p-2 rounded-lg transition-colors ${showAIPanel ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="AI Tools"
              >
                <Sparkles size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <WhiteboardToolbar 
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        selectedFillColor={selectedFillColor}
        onFillColorChange={setSelectedFillColor}
        opacity={opacity}
        onOpacityChange={setOpacity}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        fontFamily={fontFamily}
        onFontFamilyChange={setFontFamily}
        textStyle={textStyle}
        onTextStyleChange={(newStyle) => setTextStyle(prev => ({ ...prev, ...newStyle }))}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={!!selectedObject}
      />

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Canvas */}
        <div className="flex-1 relative" ref={canvasContainerRef}>
          <canvas id="whiteboard-canvas" className="absolute inset-0" />
          
          {/* User Cursors */}
          {activeUsers.map(user => (
            <div
              key={user.id}
              className="absolute pointer-events-none z-10 transition-all duration-100"
              style={{
                left: user.cursor.x,
                top: user.cursor.y,
                transform: 'translate(-2px, -2px)'
              }}
            >
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: user.color }}
              />
              <div 
                className="mt-1 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap"
                style={{ backgroundColor: user.color }}
              >
                {user.name}
              </div>
            </div>
          ))}
        </div>

        {/* Side Panels */}
        {showLayersPanel && (
          <LayersPanel
            objects={objects}
            selectedObject={selectedObject}
            onSelectObject={setSelectedObject}
            onLayerChange={handleLayerChange}
            onClose={() => setShowLayersPanel(false)}
          />
        )}

        {showCollaborationPanel && (
          <CollaborationPanel
            whiteboard={whiteboard}
            onClose={() => setShowCollaborationPanel(false)}
          />
        )}

        {showAIPanel && (
          <AIPanel
            onGenerate={handleAIGenerate}
            onClose={() => setShowAIPanel(false)}
          />
        )}
      </div>

      {/* Mermaid Renderer (hidden) */}
      <MermaidRenderer />
    </div>
  );
};