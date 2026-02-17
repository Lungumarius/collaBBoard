# Whiteboard Service

Real-time collaborative whiteboard microservice for CollabBoard platform.

## 🚀 Quick Start

### Prerequisites
- Java 17+
- PostgreSQL 14+
- Maven 3.8+

### Running Locally

1. **Start PostgreSQL** (if not already running):
```bash
docker-compose up -d postgres
```

2. **Run the service:**
```bash
./mvnw spring-boot:run
```

Service will start on port **8081**

## 📋 Features

- Board CRUD operations
- Shape management (draw, shapes, text, sticky notes)
- Real-time collaboration via WebSocket
- User collaboration management
- JWT authentication (validates tokens from auth-service)

## 🏗️ Architecture

- **Port:** 8081
- **Database Schema:** `whiteboard`
- **Authentication:** JWT tokens from auth-service
- **Real-time:** Spring WebSocket

## 📁 Project Structure

```
whiteboard-service/
├── src/main/java/com/smartexpenses/whiteboard/
│   ├── model/          # Entity models
│   ├── repository/     # JPA repositories
│   ├── service/        # Business logic
│   ├── controller/     # REST controllers
│   ├── websocket/      # WebSocket handlers
│   ├── config/         # Configuration classes
│   ├── dto/            # Data transfer objects
│   └── exception/      # Exception handlers
└── src/main/resources/
    └── db/migration/   # Flyway migrations
```

## 🔗 Integration

- **Auth Service:** http://localhost:8080 (for token validation)
- **Frontend:** Will connect to this service via REST + WebSocket

## 📝 API Endpoints

(To be documented as we build)

## 🗄️ Database

Uses PostgreSQL with Flyway migrations. Schema: `whiteboard`
