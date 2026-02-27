# CollabBoard - Project Context and Guidelines

## Project Overview
CollabBoard is a microservices-based collaborative whiteboard platform. It features real-time synchronization, user authentication, and persistent storage of boards and shapes.

## System Architecture
The application is structured into the following main components:
- **API Gateway (Nginx):** Acts as the primary entry point. It routes HTTP traffic to the frontend or specific backend microservices and handles WebSocket connection upgrades.
- **Frontend (Next.js):** A modern React application (Next.js 14) using Fabric.js for canvas rendering and manipulation. It manages state via stores and communicates with the backend services via REST APIs and WebSockets (STOMP).
- **Auth Service (Spring Boot):** A dedicated microservice responsible for user identity, registration, and login. It uses JWT (JSON Web Tokens) for stateless authentication and manages its own PostgreSQL schema (`auth`).
- **Whiteboard Service (Spring Boot):** The core business logic service handling boards, shapes, and real-time collaboration. It utilizes Spring WebSocket with STOMP protocol for real-time updates and manages its own PostgreSQL schema (`whiteboard`).
- **Database (PostgreSQL 15):** A single PostgreSQL instance shared by the backend services, but logically separated using distinct schemas.

## Tech Stack
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Fabric.js, Lucide React.
- **Backend Services:** Java 17, Spring Boot 3.5.x, Spring Security, Spring Data JPA (Hibernate), Flyway (Database Migrations).
- **Real-time Communication:** STOMP over WebSocket (SockJS on the client).
- **Infrastructure:** Docker, Docker Compose, Nginx.

## Key Design Patterns & Decisions
1. **Database Segregation:** Services use separate database schemas (`auth` and `whiteboard`) within the same PostgreSQL instance to maintain bounded contexts.
2. **Stateless Authentication:** JWT is used across the system. The Auth service issues tokens, and the Whiteboard service validates them to authorize API and WebSocket requests.
3. **Real-time Sync:** The whiteboard state is synchronized across connected clients using the STOMP protocol. Changes (like adding or moving a shape) are broadcasted to subscribers of a specific board topic.

## Gemini CLI - Core Guidelines
When making changes to this codebase, I must adhere to the following rules:
- **Microservice Boundaries:** Respect the separation of concerns. Do not mix Auth domain logic into the Whiteboard service, and vice-versa.
- **Schema Management:** Any database changes must be accompanied by a new Flyway migration script in the respective service's `src/main/resources/db/migration/` folder.
- **WebSocket Protocol:** When modifying real-time features, ensure both the Spring Boot STOMP controllers and the Next.js WebSocket client (`app/lib/websocket.ts`) are updated in sync.
- **UI Performance & Throttling:** Never send real-time coordinates or shape dragging updates on every single pixel/frame (e.g. `mouse:move`, `object:moving`). ALWAYS use a time-based throttle (e.g., 30-50ms) to ensure smooth ~30-60fps UI performance and prevent network lag.
- **Infinite Canvas Conventions:** The whiteboard uses an infinite canvas model (Pan & Zoom). When calculating positions for fixed UI elements (like modals or generated templates), always factor in the `canvas.viewportTransform` so they don't appear off-screen if the user is zoomed or panned away from the origin.
- **Fabric.js Groups:** When interacting with selections, remember that multi-selected items are wrapped in an `ActiveSelection` group which masks their individual data properties. Always unpack `target.getObjects()` when performing bulk actions (like deletion).
- **Docker First:** Ensure that any new dependencies or configuration changes are compatible with the existing `docker-compose` setup.
- **Testing:** Always look for existing tests in `src/test/java` for the backend or run any configured frontend tests before finalizing a change. Add new tests for bug fixes or features.
- **Continuous Documentation:** Record every resolved issue, implemented feature, or structural change step-by-step in `CHANGELOG.md` at the root directory. This ensures clear context for future sessions.
