# Local Development Guide - CollabBoard

## 🚀 Quick Start (Localhost)

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- Maven 3.8+ (or use Maven wrapper)

---

## 1. Start PostgreSQL (Docker)

```bash
cd /Users/mariuslungu/Projects/collabboard
docker-compose up -d postgres
```

Wait for PostgreSQL to be healthy (check with `docker ps`).

---

## 2. Start Auth Service

```bash
cd auth-service
./mvnw spring-boot:run
```

Service will start on **http://localhost:8080**

---

## 3. Start Whiteboard Service

```bash
cd whiteboard-service
./mvnw spring-boot:run
```

Service will start on **http://localhost:8081**

---

## 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on **http://localhost:3000**

---

## 📋 Environment Variables (Localhost)

### Auth Service
Edit `auth-service/src/main/resources/application.properties`:
```properties
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost:5432/platform
spring.datasource.username=postgres
spring.datasource.password=postgres
jwt.secret=0547cebf77ce84024afb31410a1c6c7f
jwt.expiration=10000
```

### Whiteboard Service
Edit `whiteboard-service/src/main/resources/application.properties`:
```properties
server.port=8081
spring.datasource.url=jdbc:postgresql://localhost:5432/platform
spring.datasource.username=postgres
spring.datasource.password=postgres
jwt.secret=0547cebf77ce84024afb31410a1c6c7f
auth.service.url=http://localhost:8080
```

### Frontend
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8081/ws
```

---

## 🔄 Development Workflow

### 1. First Time Setup

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Wait a few seconds for PostgreSQL to be ready
sleep 5

# 3. Start Auth Service (in terminal 1)
cd auth-service && ./mvnw spring-boot:run

# 4. Start Whiteboard Service (in terminal 2)
cd whiteboard-service && ./mvnw spring-boot:run

# 5. Start Frontend (in terminal 3)
cd frontend && npm install && npm run dev
```

### 2. Daily Development

Just run the services you need. If PostgreSQL is already running:
```bash
# Terminal 1: Auth Service
cd auth-service && ./mvnw spring-boot:run

# Terminal 2: Whiteboard Service  
cd whiteboard-service && ./mvnw spring-boot:run

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

## 🧪 Testing Local Setup

### 1. Test Auth Service
```bash
curl http://localhost:8080/api/auth/public/health || echo "Auth service not responding"
```

### 2. Test Whiteboard Service
```bash
curl http://localhost:8081/api/boards/public
# Should return: []
```

### 3. Test Frontend
Open browser: **http://localhost:3000**

---

## 🐛 Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port Already in Use
```bash
# Check what's using port 8080
lsof -ti:8080

# Kill process (replace PID)
kill -9 <PID>

# Or change port in application.properties
```

### Database Migration Issues
```bash
# Check if schema exists
docker exec -it collabboard-postgres psql -U postgres -d platform -c "\dn whiteboard"

# Check migration status
docker exec -it collabboard-postgres psql -U postgres -d platform -c "SELECT * FROM whiteboard.flyway_schema_history;"
```

### Frontend Build Issues
```bash
# Clear Next.js cache
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

---

## 📁 Project Structure

```
collabboard/
├── auth-service/          # Port 8080
│   └── src/main/resources/application.properties
├── whiteboard-service/    # Port 8081
│   └── src/main/resources/application.properties
├── frontend/              # Port 3000
│   ├── .env.local         # Create this file
│   └── package.json
└── docker-compose.yml     # PostgreSQL only
```

---

## 🔗 Local URLs

- **PostgreSQL**: `localhost:5432`
- **Auth Service**: `http://localhost:8080`
- **Whiteboard Service**: `http://localhost:8081`
- **Frontend**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:8081/ws`

---

## 💡 Tips

1. **Use separate terminals** for each service for better logging
2. **Keep PostgreSQL running** - don't restart it often
3. **Hot reload works** - changes in code auto-reload
4. **Check logs** if something doesn't work
5. **Use browser DevTools** for frontend debugging

---

## 🛑 Stop All Services

```bash
# Stop Auth Service: Ctrl+C in terminal 1
# Stop Whiteboard Service: Ctrl+C in terminal 2
# Stop Frontend: Ctrl+C in terminal 3

# Stop PostgreSQL
docker-compose down
```

---

## ✅ Verification Checklist

- [ ] PostgreSQL running on port 5432
- [ ] Auth Service running on port 8080
- [ ] Whiteboard Service running on port 8081
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Can register/login via frontend
- [ ] WebSocket connections work
