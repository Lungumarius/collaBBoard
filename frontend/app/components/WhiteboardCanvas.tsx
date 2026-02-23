'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { wsClient } from '@/app/lib/websocket';
import { WebSocketMessage, WebSocketMessageType, ShapeType, Shape } from '@/app/types';
import { useAuthStore } from '@/app/store/authStore';
import WhiteboardToolbar from './WhiteboardToolbar';
import TextInputModal from './TextInputModal';

interface WhiteboardCanvasProps {
  boardId: string;
  token: string;
  shapes: Shape[];
  onShapeChange?: (shapes: Shape[]) => void;
  onToolChange?: (tool: string) => void;
}

export default function WhiteboardCanvas({ boardId, token, shapes, onShapeChange, onToolChange }: WhiteboardCanvasProps) {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef<boolean>(false); // Ref for closure access
  const drawingStartPoint = useRef<{ x: number; y: number } | null>(null);
  const currentShapeRef = useRef<fabric.Object | null>(null);
  const [activeUsers, setActiveUsers] = useState<Map<string, { userId: string; email: string; cursor?: { x: number; y: number } }>>(new Map());
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const selectedToolRef = useRef<string>('select');
  const selectedColorRef = useRef<string>('#000000');
  const isApplyingServerUpdateRef = useRef<boolean>(false);
  const isInitializedRef = useRef(false);
  
  // Text/Sticky note input modal state
  const [textModal, setTextModal] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    type: 'text' | 'sticky';
    onSave: (text: string) => void;
  } | null>(null);

  const loadShapeToCanvas = useCallback((shape: Shape, canvas: fabric.Canvas) => {
    let fabricObject: fabric.Object | null = null;

    switch (shape.type) {
      case ShapeType.RECTANGLE:
        fabricObject = new fabric.Rect({
          left: shape.data.x || 0,
          top: shape.data.y || 0,
          width: shape.data.width || 100,
          height: shape.data.height || 100,
          fill: shape.data.fill || 'transparent',
          stroke: shape.data.stroke || '#000000',
          strokeWidth: shape.data.strokeWidth || 2,
        });
        break;
      case ShapeType.CIRCLE:
        fabricObject = new fabric.Circle({
          left: (shape.data.x || 0) - (shape.data.radius || 50),
          top: (shape.data.y || 0) - (shape.data.radius || 50),
          radius: shape.data.radius || 50,
          fill: shape.data.fill || 'transparent',
          stroke: shape.data.stroke || '#000000',
          strokeWidth: shape.data.strokeWidth || 2,
        });
        break;
      case ShapeType.TEXT:
        fabricObject = new fabric.Text(shape.data.text || 'Text', {
          left: shape.data.x || 0,
          top: shape.data.y || 0,
          fontSize: shape.data.fontSize || 20,
          fill: shape.data.fill || '#000000',
          fontFamily: shape.data.fontFamily || 'Arial',
        });
        break;
      case ShapeType.ARROW:
        fabricObject = new fabric.Line(
          [
            shape.data.x1 || 0,
            shape.data.y1 || 0,
            shape.data.x2 || 100,
            shape.data.y2 || 100,
          ],
          {
            stroke: shape.data.stroke || '#000000',
            strokeWidth: shape.data.strokeWidth || 2,
          }
        );
        break;
      case ShapeType.LINE:
        fabricObject = new fabric.Line(
          [
            shape.data.x1 || 0,
            shape.data.y1 || 0,
            shape.data.x2 || 100,
            shape.data.y2 || 100,
          ],
          {
            stroke: shape.data.stroke || '#000000',
            strokeWidth: shape.data.strokeWidth || 2,
          }
        );
        break;
      case ShapeType.STICKY_NOTE:
        fabricObject = new fabric.Rect({
          left: shape.data.x || 0,
          top: shape.data.y || 0,
          width: shape.data.width || 200,
          height: shape.data.height || 150,
          fill: shape.data.fill || '#FFFF99',
          stroke: '#DDD',
          strokeWidth: 1,
        });
        if (shape.data.text) {
          const text = new fabric.Text(shape.data.text, {
            left: shape.data.x || 0,
            top: shape.data.y || 0,
            fontSize: 14,
            fill: '#000000',
            width: shape.data.width || 200,
          });
          canvas.add(text);
        }
        break;
      case ShapeType.PEN:
        if (shape.data.path && Array.isArray(shape.data.path) && shape.data.path.length > 0) {
          try {
            const pathCommands = shape.data.path.map((point: number[], index: number) => {
              const [x, y] = point;
              return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            }).join(' ');
            
            fabricObject = new fabric.Path(pathCommands, {
              left: shape.data.x || 0, // Use stored X
              top: shape.data.y || 0,  // Use stored Y
              stroke: shape.data.stroke || '#000000',
              strokeWidth: shape.data.strokeWidth || 2,
              fill: 'transparent', // Explicit transparent fill
              strokeLineCap: 'round',
              strokeLineJoin: 'round'
            });
          } catch (error) {
            console.error('Error loading PEN shape:', error);
            return;
          }
        }
        break;
      default:
        return;
    }

    if (fabricObject) {
      (fabricObject as any).set('data', { shapeId: shape.id, layerOrder: shape.layerOrder });
      canvas.add(fabricObject);
    }
  }, []);

  const handleShapeEvent = useCallback((message: WebSocketMessage, canvas: fabric.Canvas) => {
    switch (message.type) {
      case WebSocketMessageType.SHAPE_CREATE:
        if (message.shapeId && message.shapeType && message.shapeData) {
          const existingObjects = canvas.getObjects();
          const existsById = existingObjects.some((obj: any) => obj.data?.shapeId === message.shapeId);
          
          if (existsById) return;
          
          if (currentUserId && message.userId === currentUserId) {
            const localShape = existingObjects.find((obj: any) => obj.data?.isLocal && !obj.data?.shapeId);
            if (localShape) {
              (localShape as any).set('data', { ...(localShape as any).data, shapeId: message.shapeId, isLocal: false });
              return;
            }
          }
          
          const shape: Shape = {
            id: message.shapeId,
            boardId: boardId,
            type: message.shapeType,
            data: message.shapeData,
            layerOrder: message.layerOrder || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: message.userId,
          };
          loadShapeToCanvas(shape, canvas);
          canvas.renderAll();
        }
        break;
      case WebSocketMessageType.SHAPE_UPDATE:
        const objects = canvas.getObjects();
        const obj = objects.find((o: any) => o.data?.shapeId === message.shapeId);
        if (obj && message.shapeData) {
          const originalData = (obj as any).data;
          isApplyingServerUpdateRef.current = true;
          
          // Map x/y to left/top for Fabric.js
          const updateData = { ...message.shapeData };
          if (updateData.x !== undefined) {
            updateData.left = updateData.x;
            delete updateData.x;
          }
          if (updateData.y !== undefined) {
            updateData.top = updateData.y;
            delete updateData.y;
          }

          // For Paths, ensure fill is transparent if not specified or empty
          if (obj instanceof fabric.Path) {
             updateData.fill = updateData.fill || null;
          }
          
          obj.set(updateData);
          
          // Restore metadata
          if (originalData?.shapeId) {
            (obj as any).set('data', { ...originalData });
          }
          
          obj.setCoords(); // Refresh object coordinates
          canvas.renderAll();
          
          setTimeout(() => {
            isApplyingServerUpdateRef.current = false;
          }, 100);
        }
        break;
      case WebSocketMessageType.SHAPE_DELETE:
        const objects2 = canvas.getObjects();
        const objToRemove = objects2.find((o: any) => o.data?.shapeId === message.shapeId);
        if (objToRemove) {
          canvas.remove(objToRemove);
          canvas.renderAll();
        }
        break;
    }
  }, [boardId, currentUserId, loadShapeToCanvas]);

  const handleCursorEvent = useCallback((message: WebSocketMessage) => {
    if (message.userId && message.cursor) {
      setActiveUsers((prev) => {
        const newMap = new Map(prev);
        newMap.set(message.userId!, {
          userId: message.userId!,
          email: message.userEmail || 'Unknown',
          cursor: message.cursor,
        });
        return newMap;
      });

      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      cursorTimeoutRef.current = setTimeout(() => {
        setActiveUsers((prev) => {
          const newMap = new Map(prev);
          if (newMap.has(message.userId!)) {
            const user = newMap.get(message.userId!);
            if (user) {
              user.cursor = undefined;
              newMap.set(message.userId!, user);
            }
          }
          return newMap;
        });
      }, 2000);
    }
  }, []);

  const handlePresenceEvent = useCallback((message: WebSocketMessage) => {
    if (message.userId) {
      setActiveUsers((prev) => {
        const newMap = new Map(prev);
        if (message.type === WebSocketMessageType.USER_JOIN) {
          newMap.set(message.userId!, {
            userId: message.userId!,
            email: message.userEmail || 'Unknown',
          });
        } else if (message.type === WebSocketMessageType.USER_LEAVE) {
          newMap.delete(message.userId!);
        }
        return newMap;
      });
    }
  }, []);

  const extractShapeData = useCallback((obj: fabric.Object): { type: string; data: Record<string, any> } | null => {
    if (obj instanceof fabric.Rect) {
      return {
        type: ShapeType.RECTANGLE,
        data: {
          x: obj.left || 0,
          y: obj.top || 0,
          width: obj.width || 0,
          height: obj.height || 0,
          fill: obj.fill || 'transparent',
          stroke: obj.stroke || '#000000',
          strokeWidth: obj.strokeWidth || 2,
        },
      };
    } else if (obj instanceof fabric.Circle) {
      return {
        type: ShapeType.CIRCLE,
        data: {
          x: (obj.left || 0) + obj.radius,
          y: (obj.top || 0) + obj.radius,
          radius: obj.radius || 50,
          fill: obj.fill || 'transparent',
          stroke: obj.stroke || '#000000',
          strokeWidth: obj.strokeWidth || 2,
        },
      };
    } else if (obj instanceof fabric.Text) {
      return {
        type: ShapeType.TEXT,
        data: {
          x: obj.left || 0,
          y: obj.top || 0,
          text: obj.text || '',
          fontSize: obj.fontSize || 20,
          fill: obj.fill || '#000000',
          fontFamily: obj.fontFamily || 'Arial',
        },
      };
    } else if (obj instanceof fabric.Line) {
      const line = obj as any;
      return {
        type: selectedToolRef.current === 'arrow' ? ShapeType.ARROW : ShapeType.LINE,
        data: {
          x1: line.x1 || 0,
          y1: line.y1 || 0,
          x2: line.x2 || 0,
          y2: line.y2 || 0,
          stroke: obj.stroke || '#000000',
          strokeWidth: obj.strokeWidth || 2,
        },
      };
    } else if (obj instanceof fabric.Path) {
      const path = obj as any;
      const pathData = path.path || [];
      const points = pathData
        .filter((point: any[]) => point[0] === 'M' || point[0] === 'L' || point[0] === 'Q' || point[0] === 'C')
        .map((point: any[]) => {
          if (point.length >= 3) {
            return [point[1], point[2]]; // Extract x, y coordinates
          }
          return null;
        })
        .filter((p: any) => p !== null);

      return {
        type: ShapeType.PEN,
        data: {
          x: path.left, // Save position
          y: path.top,  // Save position
          path: points.length > 0 ? points : [[0, 0]],
          stroke: path.stroke || selectedColorRef.current,
          strokeWidth: path.strokeWidth || 2,
          fill: 'transparent' // Explicitly no fill
        },
      };
    }
    return null;
  }, []);

  const handleToolAction = useCallback((canvas: fabric.Canvas, pointer: { x: number; y: number }, action: 'down' | 'move' | 'up') => {
    const currentTool = selectedToolRef.current;
    const currentColor = selectedColorRef.current || '#000000';
    
    switch (currentTool) {
      case 'pen':
        break;

      case 'rectangle':
        if (action === 'down') {
          if (!drawingStartPoint.current) return;
          setIsDrawing(true);
          isDrawingRef.current = true;
          const rect = new fabric.Rect({
            left: drawingStartPoint.current.x,
            top: drawingStartPoint.current.y,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: currentColor,
            strokeWidth: 2,
          });
          (rect as any).set('data', { isLocal: true, shapeId: null });
          canvas.add(rect);
          canvas.setActiveObject(rect);
          currentShapeRef.current = rect;
          canvas.renderAll();
        } else if (action === 'move' && currentShapeRef.current && drawingStartPoint.current) {
          const rect = currentShapeRef.current as fabric.Rect;
          const width = pointer.x - drawingStartPoint.current.x;
          const height = pointer.y - drawingStartPoint.current.y;
          rect.set({ width: Math.abs(width), height: Math.abs(height) });
          if (width < 0) rect.set({ left: pointer.x });
          if (height < 0) rect.set({ top: pointer.y });
          canvas.renderAll();
        }
        break;

      case 'circle':
        if (action === 'down') {
          if (!drawingStartPoint.current) return;
          setIsDrawing(true);
          isDrawingRef.current = true;
          const circle = new fabric.Circle({
            left: drawingStartPoint.current.x,
            top: drawingStartPoint.current.y,
            radius: 0,
            fill: 'transparent',
            stroke: currentColor,
            strokeWidth: 2,
          });
          (circle as any).set('data', { isLocal: true, shapeId: null });
          canvas.add(circle);
          canvas.setActiveObject(circle);
          currentShapeRef.current = circle;
          canvas.renderAll();
        } else if (action === 'move' && currentShapeRef.current && drawingStartPoint.current) {
          const circle = currentShapeRef.current as fabric.Circle;
          const radius = Math.sqrt(
            Math.pow(pointer.x - drawingStartPoint.current.x, 2) +
            Math.pow(pointer.y - drawingStartPoint.current.y, 2)
          );
          circle.set({ 
            radius,
            left: drawingStartPoint.current.x - radius,
            top: drawingStartPoint.current.y - radius,
          });
          canvas.renderAll();
        }
        break;

      case 'text':
        if (action === 'down' && pointer) {
          setTextModal({
            isOpen: true,
            x: pointer.x,
            y: pointer.y,
            type: 'text',
            onSave: (text: string) => {
              const textObj = new fabric.Text(text, {
                left: pointer.x,
                top: pointer.y,
                fontSize: 20,
                fill: currentColor,
                fontFamily: 'Arial',
              });
              (textObj as any).set('data', { isLocal: true, shapeId: null });
              canvas.add(textObj);
              canvas.setActiveObject(textObj);
              canvas.renderAll();

              const shapeData = extractShapeData(textObj);
              if (shapeData && wsClient.isConnected()) {
                wsClient.sendShapeCreate({
                  boardId,
                  shapeType: shapeData.type,
                  shapeData: shapeData.data,
                  layerOrder: canvas.getObjects().length - 1,
                });
              }
              setTextModal(null);
            },
          });
        }
        break;

      case 'line':
      case 'arrow':
        if (action === 'down') {
          if (!drawingStartPoint.current) return;
          setIsDrawing(true);
          isDrawingRef.current = true;
          const line = new fabric.Line(
            [drawingStartPoint.current.x, drawingStartPoint.current.y, drawingStartPoint.current.x, drawingStartPoint.current.y],
            {
              stroke: currentColor,
              strokeWidth: 2,
            }
          );
          (line as any).set('data', { shapeId: null, isLocal: true });
          canvas.add(line);
          canvas.setActiveObject(line);
          currentShapeRef.current = line;
          canvas.renderAll();
        } else if (action === 'move' && currentShapeRef.current && drawingStartPoint.current) {
          const line = currentShapeRef.current as any;
          line.set({ 
            x2: pointer.x, 
            y2: pointer.y,
            x1: drawingStartPoint.current.x,
            y1: drawingStartPoint.current.y,
          });
          canvas.renderAll();
        }
        break;

      case 'sticky':
        if (action === 'down' && pointer) {
          setTextModal({
            isOpen: true,
            x: pointer.x,
            y: pointer.y,
            type: 'sticky',
            onSave: (text: string) => {
              const stickyRect = new fabric.Rect({
                left: pointer.x,
                top: pointer.y,
                width: 200,
                height: 150,
                fill: '#FFFF99',
                stroke: '#DDD',
                strokeWidth: 1,
              });
              const stickyText = new fabric.Text(text, {
                left: pointer.x + 10,
                top: pointer.y + 10,
                fontSize: 14,
                fill: '#000000',
                width: 180,
              });
              (stickyRect as any).set('data', { isLocal: true, shapeId: null, isSticky: true });
              (stickyText as any).set('data', { isLocal: true, shapeId: null, isSticky: true });
              canvas.add(stickyRect, stickyText);
              canvas.renderAll();

              const shapeData = {
                type: ShapeType.STICKY_NOTE,
                data: {
                  x: pointer.x,
                  y: pointer.y,
                  width: 200,
                  height: 150,
                  text: text,
                  fill: '#FFFF99',
                },
              };

              if (wsClient.isConnected()) {
                wsClient.sendShapeCreate({
                  boardId,
                  shapeType: shapeData.type,
                  shapeData: shapeData.data,
                  layerOrder: canvas.getObjects().length - 1,
                });
              }
              setTextModal(null);
            },
          });
        }
        break;
    }
  }, [extractShapeData, boardId]);

  const setupCanvasEvents = useCallback((canvas: fabric.Canvas, boardId: string) => {
    canvas.on('mouse:down', (opt) => {
      try {
        const currentTool = selectedToolRef.current;
        if (currentTool === 'pen') return;
        
        const pointer = canvas.getPointer(opt.e);
        if (pointer) {
          drawingStartPoint.current = pointer;
          handleToolAction(canvas, pointer, 'down');
        }
      } catch (error) {
        console.error('Error in mouse:down:', error);
      }
    });

    canvas.on('mouse:move', (opt) => {
      const currentTool = selectedToolRef.current;
      
      if (currentTool !== 'pen' && currentTool !== 'select' && isDrawingRef.current && drawingStartPoint.current) {
        const pointer = canvas.getPointer(opt.e);
        if (pointer) {
          handleToolAction(canvas, pointer, 'move');
        }
      }

      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }
      cursorThrottleRef.current = setTimeout(() => {
        try {
          const pointer = canvas.getPointer(opt.e);
          if (pointer && wsClient.isConnected()) {
            wsClient.sendCursorMove(boardId, pointer.x, pointer.y);
          }
        } catch (error) {
          console.error('Error sending cursor move:', error);
        }
      }, 50);
    });

    canvas.on('mouse:up', () => {
      if (isDrawingRef.current && currentShapeRef.current && drawingStartPoint.current && selectedToolRef.current !== 'pen') {
        const obj = currentShapeRef.current as any;
        if (obj.data?.isLocal && !obj.data?.shapeId) {
          const shapeData = extractShapeData(obj);
          if (shapeData && wsClient.isConnected()) {
            wsClient.sendShapeCreate({
              boardId,
              shapeType: shapeData.type,
              shapeData: shapeData.data,
              layerOrder: canvas.getObjects().length - 1,
            });
          }
          
          // AUTO-SWITCH TO SELECT TOOL (Fix sticky drawing bug)
          // Don't switch for Pen (free drawing) or Text (modal handles it)
          if (selectedToolRef.current !== 'pen' && selectedToolRef.current !== 'text' && selectedToolRef.current !== 'sticky') {
             handleToolSelect('select');
          }
        }
      }
      setIsDrawing(false);
      isDrawingRef.current = false;
      currentShapeRef.current = null;
      drawingStartPoint.current = null;
    });

    canvas.on('object:modified', (e) => {
      if (isApplyingServerUpdateRef.current) return;
      
      const obj = e.target as any;
      if (obj?.data?.shapeId && !obj.data?.isLocal) {
        const shapeData = extractShapeData(obj);
        if (shapeData && wsClient.isConnected()) {
          wsClient.sendShapeUpdate({
            boardId,
            shapeId: obj.data.shapeId,
            shapeData: shapeData.data,
          });
        }
      }
    });

    canvas.on('path:created', (e) => {
      const path = e.path;
      if (path) {
        try {
          const pathData = (path as any).path || [];
          const points = pathData
            .filter((point: any[]) => point[0] === 'M' || point[0] === 'L' || point[0] === 'Q' || point[0] === 'C')
            .map((point: any[]) => {
              if (point.length >= 3) {
                return [point[1], point[2]];
              }
              return null;
            })
            .filter((p: any) => p !== null);

          const currentColor = selectedColorRef.current || '#000000';
          const shapeData = {
            type: ShapeType.PEN,
            data: {
              path: points.length > 0 ? points : [[0, 0]],
              stroke: (path as any).stroke || currentColor,
              strokeWidth: (path as any).strokeWidth || 2,
            },
          };

          (path as any).set('data', { shapeId: null, isLocal: true });
          
          // FIX: Ensure path has transparent fill immediately
          (path as any).set({ fill: '' });

          if (wsClient.isConnected()) {
            wsClient.sendShapeCreate({
              boardId,
              shapeType: shapeData.type,
              shapeData: shapeData.data,
              layerOrder: canvas.getObjects().length - 1,
            });
          }
        } catch (error) {
          console.error('Error handling path:created:', error);
        }
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          const obj = activeObject as any;
          if (obj.data?.shapeId && wsClient.isConnected()) {
            wsClient.sendShapeDelete({
              boardId,
              shapeId: obj.data.shapeId,
            });
          }
          canvas.remove(activeObject);
          canvas.renderAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [boardId, extractShapeData, handleToolAction]);

  const handleExport = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 1,
    });

    const link = document.createElement('a');
    link.download = `whiteboard-${boardId}-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [boardId]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    
    const width = canvas.width || 800;
    const height = canvas.height || 600;

    switch (templateId) {
      case 'brainstorming':
        // Kanban Style Board
        const colWidth = width / 3 - 20;
        
        ['To Do', 'In Progress', 'Done'].forEach((title, i) => {
          const left = 10 + i * (colWidth + 20);
          
          // Column Header
          const header = new fabric.Rect({
            left: left,
            top: 20,
            width: colWidth,
            height: 50,
            fill: i === 0 ? '#E0E7FF' : i === 1 ? '#FEF3C7' : '#DCFCE7', // Blue, Yellow, Green light
            stroke: '#CBD5E1',
            rx: 5, ry: 5
          });
          
          const text = new fabric.Text(title, {
            left: left + 20,
            top: 35,
            fontSize: 20,
            fontWeight: 'bold',
            fill: '#334155',
            fontFamily: 'Arial',
          });
          
          // Column Body
          const body = new fabric.Rect({
            left: left,
            top: 70,
            width: colWidth,
            height: height - 100,
            fill: '#F8FAFC',
            stroke: '#E2E8F0',
            rx: 5, ry: 5
          });
          
          // Sample Sticky
          const sticky = new fabric.Rect({
            left: left + 20,
            top: 90,
            width: colWidth - 40,
            height: 80,
            fill: '#FFF',
            stroke: '#E2E8F0',
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1)', blur: 5, offsetX: 2, offsetY: 2 })
          });
          
          const sampleText = new fabric.Text(i === 0 ? 'Research' : i === 1 ? 'Design' : 'Launch', {
            left: left + 35,
            top: 110,
            fontSize: 16,
            fill: '#475569'
          });

          // Tag objects as local so they don't sync automatically as "created by user" immediately
          // In a real app you might want to sync these as shapes
          const objects = [body, header, text, sticky, sampleText];
          objects.forEach(o => {
             canvas.add(o);
             // Trigger sync manually if needed, or let user edit them to sync
             const shapeData = extractShapeData(o);
             if (shapeData && wsClient.isConnected()) {
                wsClient.sendShapeCreate({
                  boardId,
                  shapeType: shapeData.type,
                  shapeData: shapeData.data,
                  layerOrder: canvas.getObjects().length - 1,
                });
             }
          });
        });
        break;

      case 'wireframe':
        // Browser Window
        const windowFrame = new fabric.Rect({
          left: 50,
          top: 50,
          width: width - 100,
          height: height - 100,
          fill: '#FFF',
          stroke: '#94A3B8',
          strokeWidth: 2,
          rx: 8, ry: 8
        });
        
        // Window Bar
        const titleBar = new fabric.Rect({
          left: 50,
          top: 50,
          width: width - 100,
          height: 40,
          fill: '#F1F5F9',
          stroke: '#94A3B8',
          rx: 8, ry: 8 // Clip via overlay usually, but simple here
        });
        
        // URL Bar
        const urlBar = new fabric.Rect({
          left: 150,
          top: 58,
          width: width - 300,
          height: 24,
          fill: '#FFF',
          stroke: '#CBD5E1',
          rx: 12, ry: 12
        });
        
        // Window Buttons
        const r1 = new fabric.Circle({ left: 65, top: 62, radius: 6, fill: '#EF4444' });
        const r2 = new fabric.Circle({ left: 85, top: 62, radius: 6, fill: '#F59E0B' });
        const r3 = new fabric.Circle({ left: 105, top: 62, radius: 6, fill: '#10B981' });
        
        // Hero Section
        const hero = new fabric.Rect({
          left: 70,
          top: 110,
          width: width - 140,
          height: 200,
          fill: '#EEF2FF',
          stroke: '#C7D2FE'
        });
        
        const heroText = new fabric.Text('Hero Image', {
          left: width / 2 - 50,
          top: 200,
          fontSize: 24,
          fill: '#6366F1'
        });

        [windowFrame, titleBar, urlBar, r1, r2, r3, hero, heroText].forEach(o => {
            canvas.add(o);
            const shapeData = extractShapeData(o);
             if (shapeData && wsClient.isConnected()) {
                wsClient.sendShapeCreate({
                  boardId,
                  shapeType: shapeData.type,
                  shapeData: shapeData.data,
                  layerOrder: canvas.getObjects().length - 1,
                });
             }
        });
        break;

      case 'mindmap':
        const cx = width / 2;
        const cy = height / 2;
        
        // Central Node
        const centerNode = new fabric.Circle({
          left: cx - 60,
          top: cy - 60,
          radius: 60,
          fill: '#3B82F6',
          stroke: '#1D4ED8',
          strokeWidth: 2
        });
        
        const centerLabel = new fabric.Text('Central\nIdea', {
          left: cx - 35,
          top: cy - 15,
          fontSize: 20,
          fontWeight: 'bold',
          fill: '#FFF',
          textAlign: 'center',
          fontFamily: 'Arial'
        });

        // Sub Nodes positions
        const offsets = [
            { x: -200, y: -150, color: '#F87171' },
            { x: 200, y: -150, color: '#FBBF24' },
            { x: -200, y: 150, color: '#34D399' },
            { x: 200, y: 150, color: '#A78BFA' }
        ];

        const nodes: fabric.Object[] = [centerNode, centerLabel];

        offsets.forEach((off, i) => {
            // Line connection
            const line = new fabric.Line([cx, cy, cx + off.x, cy + off.y], {
                stroke: '#94A3B8',
                strokeWidth: 2,
                strokeDashArray: [5, 5]
            });
            // Push line first so it's behind
            canvas.insertAt(0, line);
            const shapeDataLine = extractShapeData(line);
            if (shapeDataLine && wsClient.isConnected()) {
                wsClient.sendShapeCreate({boardId, shapeType: shapeDataLine.type, shapeData: shapeDataLine.data, layerOrder: 0});
            }

            // Sub Node
            const subNode = new fabric.Rect({
                left: cx + off.x - 60,
                top: cy + off.y - 40,
                width: 120,
                height: 80,
                fill: off.color,
                rx: 10, ry: 10,
                stroke: 'rgba(0,0,0,0.1)'
            });
            
            const subText = new fabric.Text(`Topic ${i+1}`, {
                left: cx + off.x - 30,
                top: cy + off.y - 10,
                fontSize: 16,
                fill: '#FFF'
            });
            
            nodes.push(subNode, subText);
        });

        nodes.forEach(o => {
            canvas.add(o);
            const shapeData = extractShapeData(o);
             if (shapeData && wsClient.isConnected()) {
                wsClient.sendShapeCreate({
                  boardId,
                  shapeType: shapeData.type,
                  shapeData: shapeData.data,
                  layerOrder: canvas.getObjects().length - 1,
                });
             }
        });
        break;
    }

    canvas.renderAll();
  }, [extractShapeData, boardId]);

  const handleToolSelect = useCallback((tool: string) => {
    setSelectedTool(tool);
    selectedToolRef.current = tool;
    if (onToolChange) onToolChange(tool);

    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const currentColor = selectedColorRef.current;

    switch (tool) {
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.renderAll();
        break;
      case 'pen':
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = currentColor || '#000000';
          canvas.freeDrawingBrush.width = 2;
        }
        canvas.renderAll();
        break;
      default:
        canvas.selection = false;
        canvas.isDrawingMode = false;
        canvas.defaultCursor = 'crosshair';
    }
    canvas.renderAll();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Initialize Fabric.js canvas with responsive sizing
    const resizeCanvas = () => {
      if (fabricCanvasRef.current) {
        const container = canvasRef.current?.parentElement;
        if (container) {
          fabricCanvasRef.current.setDimensions({
            width: container.clientWidth,
            height: container.clientHeight,
          });
          fabricCanvasRef.current.renderAll();
        }
      }
    };

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth - 300,
      height: window.innerHeight - 100,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      isDrawingMode: false, // Start with drawing mode off
    });

    fabricCanvasRef.current = canvas;
    
    // Initialize refs with current state values
    selectedToolRef.current = selectedTool;
    selectedColorRef.current = selectedColor;

    // Initialize free drawing brush for pen tool (must be done after canvas creation)
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = selectedColor || '#000000';
      canvas.freeDrawingBrush.width = 2;
    } else {
      try {
        if ((fabric as any).PencilBrush) {
          (canvas as any).freeDrawingBrush = new (fabric as any).PencilBrush(canvas);
          (canvas as any).freeDrawingBrush.color = selectedColor || '#000000';
          (canvas as any).freeDrawingBrush.width = 2;
        }
      } catch (e) {
        console.error('Failed to initialize free drawing brush:', e);
      }
    }
    
    // Setup WebSocket connection
    wsClient.connect(
      boardId,
      token,
      {
        onShapeEvent: (message) => {
          handleShapeEvent(message, canvas);
        },
        onCursorEvent: (message) => {
          handleCursorEvent(message);
        },
        onPresenceEvent: (message) => {
          handlePresenceEvent(message);
        },
        onConnect: () => {
          console.log('✅ WebSocket connected - collaboration enabled');
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
        },
        onError: (error) => {
          console.error('WebSocket error:', error);
        },
      }
    );

    // Setup canvas event handlers
    const cleanupCanvasEvents = setupCanvasEvents(canvas, boardId);

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        const container = canvasRef.current?.parentElement;
        if (container) {
          canvas.setDimensions({
            width: container.clientWidth,
            height: container.clientHeight,
          });
          canvas.renderAll();
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Handle delete key
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.getActiveObject()) {
        e.preventDefault();
        const obj = canvas.getActiveObject() as any;
        if (obj?.data?.shapeId && wsClient.isConnected()) {
          wsClient.sendShapeDelete({
            boardId,
            shapeId: obj.data.shapeId,
          });
        }
        canvas.remove(canvas.getActiveObject()!);
        canvas.discardActiveObject();
        canvas.renderAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }
      cleanupCanvasEvents();
      if (canvas) {
        canvas.dispose();
      }
      wsClient.disconnect();
      isInitializedRef.current = false;
    };
  }, [boardId, token, handleShapeEvent, handleCursorEvent, handlePresenceEvent, setupCanvasEvents]);

  // Secondary effect for shapes loading
  useEffect(() => {
    if (!fabricCanvasRef.current || !shapes || shapes.length === 0) return;
    
    const canvas = fabricCanvasRef.current;
    let added = false;
    shapes.forEach((shape) => {
      const existing = canvas.getObjects().find((obj: any) => obj.data?.shapeId === shape.id);
      if (!existing) {
        loadShapeToCanvas(shape, canvas);
        added = true;
      }
    });
    if (added) canvas.renderAll();
  }, [shapes, loadShapeToCanvas]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <WhiteboardToolbar
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        onColorChange={(color) => {
          setSelectedColor(color);
          selectedColorRef.current = color; // Update ref for closures
          // Update brush color if pen tool is active
          if (fabricCanvasRef.current && selectedToolRef.current === 'pen' && fabricCanvasRef.current.freeDrawingBrush) {
            fabricCanvasRef.current.freeDrawingBrush.color = color;
          }
        }}
        selectedColor={selectedColor}
        onExport={handleExport}
        onTemplateSelect={handleTemplateSelect}
      />

      {/* Active Users */}
      {activeUsers.size > 0 && (
        <div className="bg-gray-700 text-white px-4 py-2 text-sm flex gap-4 items-center">
          <span>Active users:</span>
          {Array.from(activeUsers.values()).map((user) => (
            <span key={user.userId} className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {user.email}
            </span>
          ))}
        </div>
      )}

      {/* Canvas Container */}
      <div className="flex-1 overflow-hidden relative" ref={(el) => {
        // Store canvas container reference for modal positioning
        if (el && !canvasContainerRef.current) {
          canvasContainerRef.current = el;
        }
      }}>
        <canvas ref={canvasRef} className="border border-gray-300" />

        {/* Cursor overlays for other users */}
        {Array.from(activeUsers.values()).map(
          (user) =>
            user.cursor && (
              <div
                key={user.userId}
                className="absolute pointer-events-none"
                style={{ left: user.cursor.x, top: user.cursor.y }}
              >
                <div className="w-4 h-4 border-2 border-blue-500 rounded-full bg-blue-500 opacity-70"></div>
                <div className="absolute top-5 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {user.email}
                </div>
              </div>
            )
        )}

        {/* Text/Sticky Note Input Modal */}
        {textModal && (
          <>
            {/* Backdrop to close modal on outside click */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setTextModal(null);
              }}
            />
            <TextInputModal
              isOpen={textModal.isOpen}
              x={textModal.x}
              y={textModal.y}
              placeholder={textModal.type === 'text' ? 'Enter text...' : 'Enter sticky note text...'}
              onSave={textModal.onSave}
              onCancel={() => setTextModal(null)}
              canvasContainer={canvasContainerRef.current}
            />
          </>
        )}
      </div>
    </div>
  );
}
