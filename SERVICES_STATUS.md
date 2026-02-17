# 🚀 CollabBoard - Services Status

## ✅ Currently Running:

1. **Frontend** ✅
   - URL: http://localhost:3000
   - Status: Running
   - PID: Check with `cat /tmp/frontend.pid`

2. **Whiteboard Service** ✅
   - URL: http://localhost:8081
   - Status: Running
   - PID: Check with `cat /tmp/whiteboard-service.pid`

3. **PostgreSQL** ✅
   - Port: 5432
   - Status: Running (existing container)

## ❌ Not Running:

1. **Auth Service** ❌
   - URL: http://localhost:8080
   - Issue: Database connection error (trying to connect to "postgres" hostname)
   - Fix needed: Update `application.properties` to use `localhost:5432`

## 🔧 To Fix Auth Service:

1. Update `auth-service/src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/platform
   ```

2. Then restart Auth Service:
   ```bash
   kill $(cat /tmp/auth-service.pid) 2>/dev/null
   cd auth-service && ./mvnw spring-boot:run > /tmp/auth-service.log 2>&1 &
   echo $! > /tmp/auth-service.pid
   ```

## 📋 Check Service Logs:

```bash
# Frontend
tail -f /tmp/frontend.log

# Whiteboard Service
tail -f /tmp/whiteboard-service.log

# Auth Service
tail -f /tmp/auth-service.log
```

## 🛑 Stop All Services:

```bash
# Stop Frontend
kill $(cat /tmp/frontend.pid) 2>/dev/null

# Stop Whiteboard Service
kill $(cat /tmp/whiteboard-service.pid) 2>/dev/null

# Stop Auth Service
kill $(cat /tmp/auth-service.pid) 2>/dev/null
```
