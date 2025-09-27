import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Whiteboard, CanvasObject, ActiveUser } from '../../types';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { ActiveCollaborators } from './ActiveCollaborators';
import { useWebSocket } from '../../hooks/useWebSocket';

interface WhiteboardCanvasProps {
  whiteboardId: string;
  onBack: () => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  whiteboardId,
  onBack
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'rect' | 'circle' | 'arrow'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggedObject, setDraggedObject] = useState<string | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  const { sendMessage, isConnected } = useWebSocket(whiteboardId, {
    onWhiteboardUpdate: (updatedWhiteboard: Whiteboard) => {
      setWhiteboard(updatedWhiteboard);
      setObjects(updatedWhiteboard.content.objects);
    },
    onActiveUsersUpdate: (users: ActiveUser[]) => {
      setActiveUsers(users);
    },
    onObjectUpdate: (object: CanvasObject) => {
      setObjects(prev => prev.map(obj => obj.id === object.id ? object : obj));
    },
    onObjectCreate: (object: CanvasObject) => {
      setObjects(prev => [...prev, object]);
    },
    onObjectDelete: (objectId: string) => {
      setObjects(prev => prev.filter(obj => obj.id !== objectId));
    }
  });

  useEffect(() => {
    fetchWhiteboard();
  }, [whiteboardId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    drawCanvas(ctx);
  }, [objects, activeUsers]);

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

  const drawCanvas = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current!;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    // Draw grid
    drawGrid(ctx);

    // Draw objects
    objects.forEach(obj => drawObject(ctx, obj));

    // Draw cursors
    activeUsers.forEach(user => drawCursor(ctx, user));
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current!;
    const gridSize = 20;
    
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= canvas.width / window.devicePixelRatio; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / window.devicePixelRatio);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height / window.devicePixelRatio; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / window.devicePixelRatio, y);
      ctx.stroke();
    }
  };

  const drawObject = (ctx: CanvasRenderingContext2D, obj: CanvasObject) => {
    ctx.save();
    
    const style = obj.style || {};
    ctx.fillStyle = style.backgroundColor || '#3B82F6';
    ctx.strokeStyle = style.color || '#1E40AF';
    ctx.lineWidth = style.strokeWidth || 2;

    switch (obj.type) {
      case 'text':
        ctx.fillStyle = style.color || '#000';
        ctx.font = `${style.fontSize || 16}px Arial`;
        ctx.fillText(obj.content || '', obj.x, obj.y);
        break;

      case 'shape':
        if (obj.content === 'rectangle') {
          ctx.fillRect(obj.x, obj.y, obj.width || 100, obj.height || 60);
          ctx.strokeRect(obj.x, obj.y, obj.width || 100, obj.height || 60);
        } else if (obj.content === 'circle') {
          const radius = Math.min(obj.width || 60, obj.height || 60) / 2;
          ctx.beginPath();
          ctx.arc(obj.x + radius, obj.y + radius, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y);
        if (obj.points && obj.points.length > 0) {
          obj.points.forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
        }
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  };

  const drawCursor = (ctx: CanvasRenderingContext2D, user: ActiveUser) => {
    ctx.save();
    ctx.fillStyle = user.color;
    
    // Draw cursor
    ctx.beginPath();
    ctx.moveTo(user.cursor.x, user.cursor.y);
    ctx.lineTo(user.cursor.x + 12, user.cursor.y + 4);
    ctx.lineTo(user.cursor.x + 5, user.cursor.y + 11);
    ctx.closePath();
    ctx.fill();

    // Draw name
    ctx.fillStyle = '#fff';
    ctx.fillRect(user.cursor.x + 15, user.cursor.y - 8, user.name.length * 7 + 8, 20);
    ctx.fillStyle = user.color;
    ctx.font = '12px Arial';
    ctx.fillText(user.name, user.cursor.x + 19, user.cursor.y + 6);
    
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setLastMousePos({ x, y });

    if (selectedTool === 'select') {
      // Check if clicking on existing object
      const clickedObject = findObjectAt(x, y);
      if (clickedObject) {
        setDraggedObject(clickedObject.id);
      }
    } else if (selectedTool !== 'select') {
      // Create new object
      setIsDrawing(true);
      createObject(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Send cursor position
    sendMessage({
      type: 'cursor',
      whiteboardId,
      data: { x, y }
    });

    if (draggedObject) {
      const dx = x - lastMousePos.x;
      const dy = y - lastMousePos.y;
      moveObject(draggedObject, dx, dy);
      setLastMousePos({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDraggedObject(null);
  };

  const findObjectAt = (x: number, y: number): CanvasObject | null => {
    // Find topmost object at position
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (isPointInObject(x, y, obj)) {
        return obj;
      }
    }
    return null;
  };

  const isPointInObject = (x: number, y: number, obj: CanvasObject): boolean => {
    switch (obj.type) {
      case 'text':
        return x >= obj.x && x <= obj.x + 100 && y >= obj.y - 20 && y <= obj.y;
      case 'shape':
        return x >= obj.x && x <= obj.x + (obj.width || 100) && 
               y >= obj.y && y <= obj.y + (obj.height || 60);
      default:
        return false;
    }
  };

  const createObject = (x: number, y: number) => {
    const newObject: CanvasObject = {
      id: `obj_${Date.now()}_${Math.random()}`,
      type: selectedTool === 'text' ? 'text' : 'shape',
      x,
      y,
      content: selectedTool === 'text' ? 'New Text' : 
               selectedTool === 'rect' ? 'rectangle' : 'circle',
      width: selectedTool === 'text' ? undefined : 100,
      height: selectedTool === 'text' ? undefined : 
              selectedTool === 'circle' ? 100 : 60,
      style: {
        backgroundColor: selectedTool === 'rect' ? '#3B82F6' : 
                       selectedTool === 'circle' ? '#10B981' : undefined,
        color: selectedTool === 'text' ? '#000' : '#fff',
        fontSize: selectedTool === 'text' ? 16 : undefined
      }
    };

    sendMessage({
      type: 'object_create',
      whiteboardId,
      data: { object: newObject }
    });
  };

  const moveObject = (objectId: string, dx: number, dy: number) => {
    const objectIndex = objects.findIndex(obj => obj.id === objectId);
    if (objectIndex === -1) return;

    const updatedObject = {
      ...objects[objectIndex],
      x: objects[objectIndex].x + dx,
      y: objects[objectIndex].y + dy
    };

    sendMessage({
      type: 'object_update',
      whiteboardId,
      data: { object: updatedObject }
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  if (!whiteboard) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Whiteboard not found</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
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
          
          <ActiveCollaborators users={activeUsers} />
        </div>
      </header>

      {/* Toolbar */}
      <WhiteboardToolbar 
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
      />

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};