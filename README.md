# CollabBoard - Real-time Collaborative Whiteboard Platform

## 🎯 Overview
CollabBoard este o platformă de whiteboard colaborativ în timp real pentru echipe. Permite utilizatorilor să deseneze, creeze wireframes, facă brainstorming și colaboreze vizual în timp real.

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  Next.js + Fabric.js + Tailwind
│   (Next.js)     │
└────────┬────────┘
         │ HTTP/REST + WebSocket
         │
    ┌────┴────┬──────────────────┐
    │         │                  │
┌───▼───┐ ┌──▼──────────┐ ┌──────▼──────┐
│ Auth  │ │ Whiteboard  │ │  WebSocket  │
│Service│ │  Service    │ │   Server    │
│(Java) │ │  (Java)     │ │   (Java)    │
└───┬───┘ └──┬──────────┘ └──────┬──────┘
    │         │                  │
    └─────────┴──────────────────┘
                 │
         ┌───────▼───────┐
         │  PostgreSQL   │
         │   Database    │
         └───────────────┘
```

## 📦 Services

### 1. Auth Service (`auth-service/`)
- **Status:** ✅ Complete
- **Port:** 8080
- **Tech:** Java Spring Boot 3.5.7
- **Features:**
  - User registration/login
  - JWT token generation
  - Refresh token mechanism
  - User management

### 2. Whiteboard Service (`whiteboard-service/`)
- **Status:** 🚧 In Development
- **Port:** 8081
- **Tech:** Java Spring Boot 3.5.7
- **Features:**
  - Board CRUD operations
  - Shape management
  - Collaboration management
  - REST API endpoints
  - WebSocket server for real-time sync

### 3. Frontend (`frontend/`) - TODO
- **Status:** ⏳ Not Started
- **Tech:** Next.js 14, Fabric.js, Tailwind CSS
- **Features:**
  - Canvas drawing interface
  - Real-time collaboration UI
  - User authentication
  - Board management

## 🚀 Quick Start (Localhost Development)

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- Maven 3.8+ (or use Maven wrapper included)

### Running Locally

**All services run on localhost for development.**

1. **Start PostgreSQL:**
```bash
docker-compose up -d postgres
```

2. **Start Auth Service** (Terminal 1):
```bash
cd auth-service
./mvnw spring-boot:run
```
Service starts on **http://localhost:8080**

3. **Start Whiteboard Service** (Terminal 2):
```bash
cd whiteboard-service
./mvnw spring-boot:run
```
Service starts on **http://localhost:8081**

4. **Start Frontend** (Terminal 3):
```bash
cd frontend
npm install  # First time only
npm run dev
```
Frontend starts on **http://localhost:3000**

📖 **Detailed guide:** See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

## 📚 Documentation

- [PROJECT_PLAN.md](./auth-service/PROJECT_PLAN.md) - Detailed project plan and architecture
- [DEVELOPMENT_LOG.md](./auth-service/DEVELOPMENT_LOG.md) - Development progress log

## 🔄 Development Workflow

1. Check `DEVELOPMENT_LOG.md` for current status
2. Review `PROJECT_PLAN.md` for architecture decisions
3. Make changes with descriptive commits
4. Update development log after each major step

## 📝 Current Status

**Phase:** ✅ **COMPLETE - Ready for Local Development**

**Completed:**
- ✅ Database schema & migrations
- ✅ Backend services (Auth + Whiteboard)
- ✅ REST API endpoints
- ✅ WebSocket real-time collaboration
- ✅ Frontend structure (Next.js + Fabric.js)
- ✅ Docker Compose for PostgreSQL
- ✅ Local development setup

**Frontend Status:** Basic structure ready, needs completion

## 📁 Project Structure

```
collabboard/
├── auth-service/          ✅ Complete
├── whiteboard-service/    🚧 In Development
├── frontend/              ⏳ Not Started
├── docker-compose.yml     ⏳ TODO
└── README.md              ✅ This file
```

## 🛠️ Tech Stack

- **Backend:** Java 17, Spring Boot 3.5.7, PostgreSQL, WebSocket
- **Frontend:** Next.js 14, React, Fabric.js, Tailwind CSS (planned)
- **Auth:** JWT, Spring Security
- **Real-time:** Spring WebSocket
- **Database:** PostgreSQL with Flyway migrations

## 📄 License

MIT
