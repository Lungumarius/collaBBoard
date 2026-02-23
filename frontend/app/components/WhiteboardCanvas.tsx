  const [isOverTrash, setIsOverTrash] = useState(false);
  const trashRef = useRef<HTMLDivElement>(null);

  // ... (rest of imports and state)

  const handleResetBoard = useCallback(() => {
    if (!confirm('Are you sure you want to clear the entire board? This action cannot be undone.')) {
      return;
    }
    
    if (fabricCanvasRef.current) {
      const objects = fabricCanvasRef.current.getObjects();
      // Delete all objects via WebSocket
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

  const handleTemplateSelect = useCallback((templateId: string) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    // DO NOT CLEAR CANVAS - Append instead
    // canvas.clear();
    // canvas.backgroundColor = '#ffffff';
    
    // Calculate center of viewport to place template
    const vpt = canvas.getViewportTransform();
    const centerX = (canvas.width! / 2 - (vpt ? vpt[4] : 0)) / (vpt ? vpt[0] : 1);
    const centerY = (canvas.height! / 2 - (vpt ? vpt[5] : 0)) / (vpt ? vpt[3] : 1);

    // Offset relative to center (assuming template width ~800px)
    const startX = centerX - 400;
    const startY = centerY - 300;

    switch (templateId) {
      case 'brainstorming':
        // Kanban Style Board
        const colWidth = 250;
        
        ['To Do', 'In Progress', 'Done'].forEach((title, i) => {
          const left = startX + 10 + i * (colWidth + 20);
          const top = startY + 20;
          
          // Column Header
          const header = new fabric.Rect({
            left: left,
            top: top,
            width: colWidth,
            height: 50,
            fill: i === 0 ? '#E0E7FF' : i === 1 ? '#FEF3C7' : '#DCFCE7', // Blue, Yellow, Green light
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
          
          // Column Body
          const body = new fabric.Rect({
            left: left,
            top: top + 50,
            width: colWidth,
            height: 400,
            fill: '#F8FAFC',
            stroke: '#E2E8F0',
            rx: 5, ry: 5
          });
          
          // Sample Sticky
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
             // Assign a temp ID so it doesn't get confused
             (o as any).set('data', { isLocal: true, shapeId: null });
             canvas.add(o);
             
             // Sync immediately
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

        // Browser Window
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
        
        // Window Bar
        const titleBar = new fabric.Rect({
          left: frameX,
          top: frameY,
          width: frameW,
          height: 40,
          fill: '#F1F5F9',
          stroke: '#94A3B8',
          rx: 8, ry: 8 
        });
        
        // URL Bar
        const urlBar = new fabric.Rect({
          left: frameX + 100,
          top: frameY + 8,
          width: frameW - 200,
          height: 24,
          fill: '#FFF',
          stroke: '#CBD5E1',
          rx: 12, ry: 12
        });
        
        // Window Buttons
        const r1 = new fabric.Circle({ left: frameX + 15, top: frameY + 12, radius: 6, fill: '#EF4444' });
        const r2 = new fabric.Circle({ left: frameX + 35, top: frameY + 12, radius: 6, fill: '#F59E0B' });
        const r3 = new fabric.Circle({ left: frameX + 55, top: frameY + 12, radius: 6, fill: '#10B981' });
        
        // Hero Section
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

    // Check collision with trash bin during drag
    canvas.on('object:moving', (e) => {
        if (trashRef.current && e.target) {
            const trashRect = trashRef.current.getBoundingClientRect();
            const pointer = canvas.getPointer(e.e);
            
            // Note: pointer coordinates are relative to canvas, but trashRect is viewport
            // We need to convert pointer to viewport or use clientX/Y from event
            const { clientX, clientY } = e.e as MouseEvent;
            
            if (
                clientX >= trashRect.left &&
                clientX <= trashRect.right &&
                clientY >= trashRect.top &&
                clientY <= trashRect.bottom
            ) {
                setIsOverTrash(true);
                e.target.set('opacity', 0.5); // Visual feedback on object
            } else {
                setIsOverTrash(false);
                e.target.set('opacity', 1);
            }
            canvas.requestRenderAll();
        }
    });

    // Handle delete on drop
    canvas.on('mouse:up', (e) => {
        if (isOverTrash && e.target) {
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
        }
        
        // Existing logic for shape creation...
        // ... (this part is handled in setupCanvasEvents, but we need to ensure no conflict)
    });

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
        // Store canvas container reference for modal positioning
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
