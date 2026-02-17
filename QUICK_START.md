# 🚀 Quick Start - CollabBoard (Localhost)

## Start Everything in 4 Steps

### 1️⃣ Start PostgreSQL
```bash
cd /Users/mariuslungu/Projects/collabboard
docker-compose up -d postgres
```

### 2️⃣ Start Auth Service (Terminal 1)
```bash
cd auth-service
./mvnw spring-boot:run
```
✅ Runs on: **http://localhost:8080**

### 3️⃣ Start Whiteboard Service (Terminal 2)
```bash
cd whiteboard-service
./mvnw spring-boot:run
```
✅ Runs on: **http://localhost:8081**

### 4️⃣ Start Frontend (Terminal 3)
```bash
cd frontend
npm install  # First time only
npm run dev
```
✅ Runs on: **http://localhost:3000**

---

## ✅ Verify Everything Works

1. **PostgreSQL:** `docker ps | grep postgres` ✅
2. **Auth Service:** `curl http://localhost:8080/api/auth/health` ✅
3. **Whiteboard Service:** `curl http://localhost:8081/api/boards/public` ✅ (returns `[]`)
4. **Frontend:** Open **http://localhost:3000** in browser ✅

---

## 🛑 Stop Everything

- **PostgreSQL:** `docker-compose down`
- **Services:** Press `Ctrl+C` in each terminal

---

📖 **Full guide:** [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
