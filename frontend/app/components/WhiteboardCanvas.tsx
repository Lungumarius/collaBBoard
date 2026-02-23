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
  const isDrawingRef = useRef<boolean>(false); 
  const drawingStartPoint = useRef<{ x: number; y: number } | null>(null);
  const currentShapeRef = useRef<fabric.Object | null>(null);
  const [activeUsers, setActiveUsers] = useState<Map<string, { userId: string; email: string; cursor?: { x: number; y: number } }>>(new Map());
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const selectedToolRef = useRef<string>('select');
  const selectedColorRef = useRef<string>('#000000');
  const isApplyingServerUpdateRef = useRef<boolean>(false);
  const isInitializedRef = useRef(false);
  
  const [isOverTrash, setIsOverTrash] = useState(false);
  const trashRef = useRef<HTMLDivElement>(null);
  
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
              stroke: shape.data.stroke || '#000000',
              strokeWidth: shape.data.strokeWidth || 2,
              fill: 'transparent',
              strokeLineCap: 'round',
              strokeLineJoin: 'round'
            });
            fabricObject.set({
                left: shape.data.x || 0,
                top: shape.data.y || 0
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
          isApplyingServerUpdateRef.current = true;
          
          const updateData = { ...message.shapeData };
          if (updateData.x !== undefined) {
            updateData.left = updateData.x;
            delete updateData.x;
          }
          if (updateData.y !== undefined) {
            updateData.top = updateData.y;
            delete updateData.y;
          }

          if (obj instanceof fabric.Path) {
             updateData.fill = updateData.fill || null;
             if (updateData.path) {
               delete updateData.path;
             }
          }
          
          obj.set(updateData);
          obj.setCoords(); 
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
            return [point[1], point[2]]; 
          }
          return null;
        })
        .filter((p: any) => p !== null);

      return {
        type: ShapeType.PEN,
        data: {
          x: path.left, 
          y: path.top,
          path: points.length > 0 ? points : [[0, 0]],
          stroke: path.stroke || selectedColorRef.current,
          strokeWidth: path.strokeWidth || 2,
          fill: 'transparent'
        },
      };
    }
    return null;
  }, []);

  // Defined BEFORE setupCanvasEvents because it's a dependency
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
  }, [onToolChange]);

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
        
        // Fabric v6: Use scenePoint directly if available, otherwise fallback
        const pointer = opt.scenePoint || canvas.getPointer(opt.e);
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
        // Fabric v6 compatibility
        const pointer = opt.scenePoint || canvas.getPointer(opt.e);
        if (pointer) {
          handleToolAction(canvas, pointer, 'move');
        }
      }

      if (cursorThrottleRef.current) {
        clearTimeout(cursorThrottleRef.current);
      }
      cursorThrottleRef.current = setTimeout(() => {
        try {
          const pointer = opt.scenePoint || canvas.getPointer(opt.e);
          if (pointer && wsClient.isConnected()) {
            wsClient.sendCursorMove(boardId, pointer.x, pointer.y);
          }
        } catch (error) {
          console.error('Error sending cursor move:', error);
        }
      }, 50);
    });

    canvas.on('mouse:up', (e) => {
        if (trashRef.current && e.target) {
            const trashRect = trashRef.current.getBoundingClientRect();
            const { clientX, clientY } = e.e as MouseEvent;
            
            if (
                clientX >= trashRect.left &&
                clientX <= trashRect.right &&
                clientY >= trashRect.top &&
                clientY <= trashRect.bottom
            ) {
                const obj = e.target as any;
                if (obj.data?.shapeId && wsClient.isConnected()) {
                    wsClient.sendShapeDelete({
                        boardId,
                        shapeId: obj.data.shapeId,
                    });
                }
                canvas.remove(obj);
                setIsOverTrash(false);
                canvas.requestRenderAll();
                return;
            }
        }

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

    canvas.on('object:moving', (e) => {
        if (trashRef.current && e.target) {
            const trashRect = trashRef.current.getBoundingClientRect();
            const { clientX, clientY } = e.e as MouseEvent;
            
            if (
                clientX >= trashRect.left &&
                clientX <= trashRect.right &&
                clientY >= trashRect.top &&
                clientY <= trashRect.bottom
            ) {
                setIsOverTrash(true);
                e.target.set('opacity', 0.5);
            } else {
                setIsOverTrash(false);
                e.target.set('opacity', 1);
            }
            canvas.requestRenderAll();
        }

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

    canvas.on('object:modified', (e) => {
        if (e.action === 'drag') return; 

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

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [boardId, extractShapeData, handleToolAction, handleToolSelect]);

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
    
    // Calculate center of viewport to place template
    const vpt = (canvas as any).getViewportTransform() || [1, 0, 0, 1, 0, 0];
    const centerX = (canvas.width! / 2 - vpt[4]) / vpt[0];
    const centerY = (canvas.height! / 2 - vpt[5]) / vpt[3];

    const startX = centerX - 400;
    const startY = centerY - 300;

    switch (templateId) {
      case 'brainstorming':
        const colWidth = 250;
        
        ['To Do', 'In Progress', 'Done'].forEach((title, i) => {
          const left = startX + 10 + i * (colWidth + 20);
          const top = startY + 20;
          
          const header = new fabric.Rect({
            left: left,
            top: top,
            width: colWidth,
            height: 50,
            fill: i === 0 ? '#E0E7FF' : i === 1 ? '#FEF3C7' : '#DCFCE7',
            stroke: '#CBD5E1',
            rx: 5, ry: 5
          });
          
          const text = new fabric.Text(title, {
            left: left + 20,
            top: top + 15,
            fontSize: 20,
            fontWeight: 'bold',
            fill: '#334155',
            fontFamily: 'Arial',
          });
          
          const body = new fabric.Rect({
            left: left,
            top: top + 50,
            width: colWidth,
            height: 400,
            fill: '#F8FAFC',
            stroke: '#E2E8F0',
            rx: 5, ry: 5
          });
          
          const sticky = new fabric.Rect({
            left: left + 20,
            top: top + 70,
            width: colWidth - 40,
            height: 80,
            fill: '#FFF',
            stroke: '#E2E8F0',
            shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1)', blur: 5, offsetX: 2, offsetY: 2 })
          });
          
          const sampleText = new fabric.Text(i === 0 ? 'Research' : i === 1 ? 'Design' : 'Launch', {
            left: left + 35,
            top: top + 90,
            fontSize: 16,
            fill: '#475569'
          });

          const objects = [body, header, text, sticky, sampleText];
          objects.forEach(o => {
             (o as any).set('data', { isLocal: true, shapeId: null });
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
        });
        break;

      case 'wireframe':
        const frameX = startX + 50;
        const frameY = startY + 50;
        const frameW = 700;
        const frameH = 500;

        const windowFrame = new fabric.Rect({
          left: frameX,
          top: frameY,
          width: frameW,
          height: frameH,
          fill: '#FFF',
          stroke: '#94A3B8',
          strokeWidth: 2,
          rx: 8, ry: 8
        });
        
        const titleBar = new fabric.Rect({
          left: frameX,
          top: frameY,
          width: frameW,
          height: 40,
          fill: '#F1F5F9',
          stroke: '#94A3B8',
          rx: 8, ry: 8 
        });
        
        const urlBar = new fabric.Rect({
          left: frameX + 100,
          top: frameY + 8,
          width: frameW - 200,
          height: 24,
          fill: '#FFF',
          stroke: '#CBD5E1',
          rx: 12, ry: 12
        });
        
        const r1 = new fabric.Circle({ left: frameX + 15, top: frameY + 12, radius: 6, fill: '#EF4444' });
        const r2 = new fabric.Circle({ left: frameX + 35, top: frameY + 12, radius: 6, fill: '#F59E0B' });
        const r3 = new fabric.Circle({ left: frameX + 55, top: frameY + 12, radius: 6, fill: '#10B981' });
        
        const hero = new fabric.Rect({
          left: frameX + 20,
          top: frameY + 60,
          width: frameW - 40,
          height: 200,
          fill: '#EEF2FF',
          stroke: '#C7D2FE'
        });
        
        const heroText = new fabric.Text('Hero Image', {
          left: frameX + frameW / 2 - 60,
          top: frameY + 150,
          fontSize: 24,
          fill: '#6366F1'
        });

        [windowFrame, titleBar, urlBar, r1, r2, r3, hero, heroText].forEach(o => {
            (o as any).set('data', { isLocal: true, shapeId: null });
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
        const cx = centerX;
        const cy = centerY;
        
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

        const offsets = [
            { x: -200, y: -150, color: '#F87171' },
            { x: 200, y: -150, color: '#FBBF24' },
            { x: -200, y: 150, color: '#34D399' },
            { x: 200, y: 150, color: '#A78BFA' }
        ];

        const nodes: fabric.Object[] = [centerNode, centerLabel];

        offsets.forEach((off, i) => {
            const line = new fabric.Line([cx, cy, cx + off.x, cy + off.y], {
                stroke: '#94A3B8',
                strokeWidth: 2,
                strokeDashArray: [5, 5]
            });
            canvas.insertAt(0, line);
            const shapeDataLine = extractShapeData(line);
            if (shapeDataLine && wsClient.isConnected()) {
                wsClient.sendShapeCreate({boardId, shapeType: shapeDataLine.type, shapeData: shapeDataLine.data, layerOrder: 0});
            }

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
            (o as any).set('data', { isLocal: true, shapeId: null });
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

  const handleResetBoard = useCallback(() => {
    if (!confirm('Are you sure you want to clear the entire board? This action cannot be undone.')) {
      return;
    }
    
    if (fabricCanvasRef.current) {
      const objects = fabricCanvasRef.current.getObjects();
      objects.forEach((obj: any) => {
        if (obj.data?.shapeId && wsClient.isConnected()) {
          wsClient.sendShapeDelete({
            boardId,
            shapeId: obj.data.shapeId
          });
        }
      });
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = '#ffffff';
    }
  }, [boardId]);

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
          selectedColorRef.current = color; 
          if (fabricCanvasRef.current && selectedToolRef.current === 'pen' && fabricCanvasRef.current.freeDrawingBrush) {
            fabricCanvasRef.current.freeDrawingBrush.color = color;
          }
        }}
        selectedColor={selectedColor}
        onExport={handleExport}
        onTemplateSelect={handleTemplateSelect}
        onResetBoard={handleResetBoard}
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
        if (el && !canvasContainerRef.current) {
          canvasContainerRef.current = el;
        }
      }}>
        <canvas ref={canvasRef} className="border border-gray-300" />

        {/* Trash Bin */}
        <div 
            ref={trashRef}
            className={`absolute bottom-8 right-8 p-4 rounded-full transition-all duration-300 z-20 flex items-center justify-center border ${
                isOverTrash 
                ? 'w-24 h-24 bg-red-100 border-red-400 scale-110 shadow-xl' 
                : 'w-16 h-16 bg-white/80 border-gray-200 shadow-lg backdrop-blur-sm hover:scale-105'
            }`}
        >
            <span className={`text-3xl transition-transform duration-300 ${isOverTrash ? 'scale-125' : ''}`}>
                🗑️
            </span>
        </div>

        {/* Cursor overlays */}
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
