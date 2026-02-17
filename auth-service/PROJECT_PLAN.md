# CollabBoard - Real-time Collaborative Whiteboard

## 🎯 Concept
Whiteboard colaborativ pentru echipe - brainstorming, wireframing, planning, mind mapping.

## 🏗️ Arhitectură

```
Frontend (Next.js + Fabric.js + Tailwind)
    ↓ HTTP/REST
Auth Service (Java Spring Boot) ✅ EXISTING
    ↓ HTTP/REST
Whiteboard Service (Java Spring Boot) - NEW
    ↓ WebSocket
WebSocket Server (Java) - NEW
    ↓
PostgreSQL Database
```

## 📦 Stack Tehnologic

### Frontend
- **Next.js 14** (React framework)
- **Fabric.js** (Canvas library pentru drawing)
- **Tailwind CSS** (Styling)
- **Socket.io Client** (WebSocket client)
- **Zustand/Context** (State management)

### Backend
- **Java 17** (Spring Boot 3.5.7)
- **Spring WebSocket** (Real-time sync)
- **PostgreSQL** (Database)
- **JWT** (Authentication - folosim auth-service existent)

## 🗄️ Database Schema

### Tables:
1. **boards** - Whiteboard boards
   - id (UUID)
   - name (String)
   - description (String)
   - owner_id (UUID) - FK to users
   - is_public (Boolean)
   - created_at, updated_at

2. **board_collaborators** - Many-to-many users-boards
   - board_id (UUID)
   - user_id (UUID)
   - role (OWNER, EDITOR, VIEWER)

3. **shapes** - Canvas elements
   - id (UUID)
   - board_id (UUID) - FK to boards
   - type (PEN, RECTANGLE, CIRCLE, TEXT, STICKY_NOTE, ARROW, LINE)
   - data (JSONB) - shape properties (coordinates, color, text, etc.)
   - layer_order (Integer)
   - created_at, updated_at

4. **board_snapshots** - Version history (optional)
   - id (UUID)
   - board_id (UUID)
   - snapshot_data (JSONB)
   - created_at

## 🔄 Real-time Sync Flow

1. User desenează pe canvas
2. Frontend trimite event via WebSocket: `{ type: 'shape:create', boardId, shapeData }`
3. WebSocket Server broadcast la toți clienții conectați la board-ul respectiv
4. Fiecare client primește update și render pe canvas
5. Backend salvează în DB (debounced pentru performance)

## 📋 Features MVP

### Phase 1: Core Functionality
- [x] Auth Service (EXISTING)
- [x] Whiteboard Service setup ✅
- [ ] Database schema & migrations
- [ ] Basic CRUD pentru boards
- [ ] WebSocket server setup

### Phase 2: Canvas & Drawing
- [ ] Frontend setup (Next.js + Fabric.js)
- [ ] Draw tools: Pen, Shapes, Text
- [ ] Toolbar UI
- [ ] Canvas rendering

### Phase 3: Real-time Collaboration
- [ ] WebSocket connection
- [ ] Shape sync (create, update, delete)
- [ ] Cursor tracking
- [ ] User presence (who's online)

### Phase 4: Polish & Deploy
- [ ] Templates (Brainstorming, Wireframe, Mind Map)
- [ ] Export (PNG, PDF)
- [ ] UI/UX improvements
- [ ] Docker Compose
- [ ] Deploy configs

## 🚀 Development Steps

### Step 1: Backend Setup
1. Create whiteboard-service project structure
2. Database schema & Flyway migrations
3. Models: Board, Shape, Collaborator
4. Repositories
5. Services: BoardService, ShapeService
6. Controllers: BoardController, WebSocketController

### Step 2: Frontend Setup
1. Next.js project initialization
2. Tailwind + Fabric.js setup
3. Auth integration (connect to auth-service)
4. Canvas component
5. Toolbar component

### Step 3: Real-time Integration
1. WebSocket client setup
2. Shape events (create, update, delete)
3. Cursor tracking
4. User presence

### Step 4: Features & Polish
1. Templates
2. Export functionality
3. UI improvements
4. Error handling

## 📁 Project Structure

```
collabboard/
├── auth-service/          ✅ EXISTING
├── whiteboard-service/    🚧 NEW - Java Spring Boot
│   ├── src/main/java/com/smartexpenses/whiteboard/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── service/
│   │   ├── controller/
│   │   ├── websocket/
│   │   └── config/
│   └── src/main/resources/
│       └── db/migration/
├── frontend/              ⏳ NEW - Next.js (TODO)
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
└── docker-compose.yml     ⏳ TODO
```

## 🔐 Authentication Flow

1. User se loghează prin auth-service → primește JWT
2. Frontend trimite JWT în header la whiteboard-service
3. Whiteboard-service validează JWT (poate face call la auth-service sau validează local)
4. WebSocket connection: JWT în query param sau header

## 📝 Notes

- Folosim auth-service existent pentru authentication
- Whiteboard-service e un microservice separat
- WebSocket pentru real-time, REST pentru CRUD
- Database separată sau schema separată pentru whiteboard data
