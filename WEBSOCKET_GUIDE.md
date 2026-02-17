# WebSocket Real-time Collaboration Guide - CollabBoard

## 🎯 Overview

CollabBoard uses **STOMP over WebSocket** for real-time collaboration. Multiple users can collaborate on the same whiteboard simultaneously, with all changes synchronized in real-time.

## 🔌 WebSocket Connection

### Endpoint
```
ws://localhost:8081/ws
```

### Connection Headers
```javascript
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>'
}
```

### STOMP Topics

#### Shape Events: `/topic/board/{boardId}/shapes`
Subscribe to receive shape create/update/delete events for a specific board.

#### Cursor Tracking: `/topic/board/{boardId}/cursors`
Subscribe to receive cursor position updates for all users on a board.

#### User Presence: `/topic/board/{boardId}/presence`
Subscribe to receive user join/leave notifications.

## 📤 Client → Server Messages

### Create Shape
**Destination:** `/app/shape/create`

```json
{
  "type": "SHAPE_CREATE",
  "boardId": "uuid",
  "shapeType": "RECTANGLE",
  "shapeData": {
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 150,
    "color": "#FF0000"
  },
  "layerOrder": 0
}
```

### Update Shape
**Destination:** `/app/shape/update`

```json
{
  "type": "SHAPE_UPDATE",
  "boardId": "uuid",
  "shapeId": "uuid",
  "shapeData": {
    "x": 150,
    "y": 150,
    "width": 250,
    "height": 200
  },
  "layerOrder": 1
}
```

### Delete Shape
**Destination:** `/app/shape/delete`

```json
{
  "type": "SHAPE_DELETE",
  "boardId": "uuid",
  "shapeId": "uuid"
}
```

### Cursor Move
**Destination:** `/app/cursor/move`

```json
{
  "type": "CURSOR_MOVE",
  "boardId": "uuid",
  "cursor": {
    "x": 150.5,
    "y": 200.3
  }
}
```

## 📥 Server → Client Messages

### Shape Create Event
**Topic:** `/topic/board/{boardId}/shapes`

```json
{
  "type": "SHAPE_CREATE",
  "boardId": "uuid",
  "shapeId": "uuid",
  "shapeType": "RECTANGLE",
  "shapeData": {
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 150,
    "color": "#FF0000"
  },
  "layerOrder": 0,
  "userId": "uuid",
  "userEmail": "user@example.com",
  "timestamp": 1234567890
}
```

### User Join Event
**Topic:** `/topic/board/{boardId}/presence`

```json
{
  "type": "USER_JOIN",
  "boardId": "uuid",
  "userId": "uuid",
  "userEmail": "user@example.com",
  "timestamp": 1234567890
}
```

### User Leave Event
**Topic:** `/topic/board/{boardId}/presence`

```json
{
  "type": "USER_LEAVE",
  "boardId": "uuid",
  "userId": "uuid",
  "userEmail": "user@example.com",
  "timestamp": 1234567890
}
```

### Cursor Move Event
**Topic:** `/topic/board/{boardId}/cursors`

```json
{
  "type": "CURSOR_MOVE",
  "boardId": "uuid",
  "userId": "uuid",
  "userEmail": "user@example.com",
  "cursor": {
    "x": 150.5,
    "y": 200.3
  },
  "timestamp": 1234567890
}
```

## 🔐 Authentication

All WebSocket connections require JWT authentication via Authorization header:

```javascript
const socket = new SockJS('http://localhost:8081/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({
  'Authorization': 'Bearer ' + jwtToken
}, function(frame) {
  console.log('Connected: ' + frame);
  
  // Subscribe to board updates
  stompClient.subscribe('/topic/board/' + boardId + '/shapes', function(message) {
    const event = JSON.parse(message.body);
    handleShapeEvent(event);
  });
});
```

## 🔒 Authorization & Permissions

### Board Access
- **Owner**: Full access (create, read, update, delete)
- **Editor**: Can create, update, delete shapes
- **Viewer**: Read-only access
- **Public Board**: Anyone can view (no edit permission unless collaborator)

### Permission Checks
- Shape create/update/delete: Requires EDITOR or OWNER role
- Cursor tracking: Requires access to board (any role or public)
- User presence: Requires access to board

## 📊 Example: JavaScript Client

```javascript
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WhiteboardWebSocket {
  constructor(jwtToken) {
    this.jwtToken = jwtToken;
    this.stompClient = null;
  }

  connect(boardId, onShapeEvent, onCursorEvent, onPresenceEvent) {
    const socket = new SockJS('http://localhost:8081/ws');
    this.stompClient = Stomp.over(socket);
    
    this.stompClient.connect({
      'Authorization': 'Bearer ' + this.jwtToken
    }, (frame) => {
      console.log('WebSocket connected:', frame);
      
      // Subscribe to shape events
      this.stompClient.subscribe(`/topic/board/${boardId}/shapes`, (message) => {
        const event = JSON.parse(message.body);
        onShapeEvent(event);
      });
      
      // Subscribe to cursor events
      this.stompClient.subscribe(`/topic/board/${boardId}/cursors`, (message) => {
        const event = JSON.parse(message.body);
        onCursorEvent(event);
      });
      
      // Subscribe to presence events
      this.stompClient.subscribe(`/topic/board/${boardId}/presence`, (message) => {
        const event = JSON.parse(message.body);
        onPresenceEvent(event);
      });
    });
  }

  createShape(boardId, shapeType, shapeData, layerOrder) {
    const message = {
      type: 'SHAPE_CREATE',
      boardId: boardId,
      shapeType: shapeType,
      shapeData: shapeData,
      layerOrder: layerOrder
    };
    
    this.stompClient.send('/app/shape/create', {}, JSON.stringify(message));
  }

  updateShape(boardId, shapeId, shapeData, layerOrder) {
    const message = {
      type: 'SHAPE_UPDATE',
      boardId: boardId,
      shapeId: shapeId,
      shapeData: shapeData,
      layerOrder: layerOrder
    };
    
    this.stompClient.send('/app/shape/update', {}, JSON.stringify(message));
  }

  deleteShape(boardId, shapeId) {
    const message = {
      type: 'SHAPE_DELETE',
      boardId: boardId,
      shapeId: shapeId
    };
    
    this.stompClient.send('/app/shape/delete', {}, JSON.stringify(message));
  }

  sendCursorMove(boardId, x, y) {
    const message = {
      type: 'CURSOR_MOVE',
      boardId: boardId,
      cursor: { x: x, y: y }
    };
    
    this.stompClient.send('/app/cursor/move', {}, JSON.stringify(message));
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
  }
}

export default WhiteboardWebSocket;
```

## 🧪 Testing WebSocket

### Using wscat (WebSocket client)

```bash
# Install wscat
npm install -g wscat

# Connect (with JWT token)
wscat -c "ws://localhost:8081/ws" -H "Authorization: Bearer YOUR_JWT_TOKEN"

# In wscat console:
# Subscribe to shape events
> SUBSCRIBE
destination:/topic/board/{boardId}/shapes
id:sub-1

# Send shape create
> SEND
destination:/app/shape/create
content-type:application/json

{"type":"SHAPE_CREATE","boardId":"uuid","shapeType":"RECTANGLE","shapeData":{"x":100,"y":100,"width":200,"height":150,"color":"#FF0000"},"layerOrder":0}
```

## 🔄 Flow Diagram

```
Client 1                    Server                  Client 2
  |                          |                        |
  |---- Shape Create ----->  |                        |
  |                          |-- Save to DB          |
  |                          |-- Broadcast -------->  |
  |                          |                        |-- Render Shape
  |<--- Confirmation -----   |                        |
```

## ✅ Features Implemented

- ✅ JWT Authentication for WebSocket connections
- ✅ Real-time shape synchronization (create, update, delete)
- ✅ Cursor tracking for all users
- ✅ User presence (join/leave notifications)
- ✅ Permission-based access control
- ✅ Broadcast to board-specific topics
- ✅ Error handling and user notifications

## 📝 Notes

- WebSocket connections are validated on connect using JWT
- All shape events are persisted to database before broadcast
- Layer order is auto-assigned if not provided
- Cursor positions are not persisted (ephemeral data)
- User presence is tracked in memory (will reset on server restart)
