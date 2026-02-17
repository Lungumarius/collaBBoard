# Deployment Guide - CollabBoard

## 🚀 Deployment Options

### 1. Local Development (Docker Compose)

```bash
# Start all services
cd /Users/mariuslungu/Projects/collabboard
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

**Services:**
- PostgreSQL: `localhost:5432`
- Auth Service: `http://localhost:8080`
- Whiteboard Service: `http://localhost:8081`
- Frontend: `http://localhost:3000`

---

## 2. Self-Hosting (Production Docker Compose)

This method deploys all services (Frontend, Auth, Whiteboard, Postgres, Nginx) on a single server using Docker Compose.

### Prerequisites
- Docker & Docker Compose installed on the server.
- Ports 80 (HTTP) and optionally 443 (HTTPS) open.

### Deployment Steps

1.  **Clone the repository** to your server.
2.  **Review Configuration**:
    - Check `docker-compose.prod.yml`.
    - Modify environment variables (especially `JWT_SECRET`, `POSTGRES_PASSWORD`).
3.  **Run with Docker Compose**:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```
4.  **Access the Application**:
    - Open your browser and go to `http://your-server-ip` or `http://localhost`.

### Architecture
- **Nginx** (Port 80): Reverse proxy routing traffic to Frontend and API services.
- **Frontend**: Accessible via `/` (routes to internal port 3000).
- **Auth Service**: Accessible via `/api/auth` (internal port 8080).
- **Whiteboard Service**: Accessible via `/api/boards` and `/ws` (internal port 8081).
- **PostgreSQL**: Internal database (not exposed externally by default in prod).

---

## 3. Railway (Backend Services)

### Auth Service & Whiteboard Service

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
railway login
```

2. **Deploy Auth Service:**
```bash
cd auth-service
railway init
railway link
railway add postgresql
railway up
```

3. **Set Environment Variables:**
```bash
railway variables set JWT_SECRET=your-secret-key
railway variables set JWT_EXPIRATION=86400000
railway variables set SPRING_DATASOURCE_URL=$DATABASE_URL
railway variables set SPRING_DATASOURCE_USERNAME=$PGUSER
railway variables set SPRING_DATASOURCE_PASSWORD=$PGPASSWORD
```

4. **Deploy Whiteboard Service:**
```bash
cd whiteboard-service
railway init
railway link
railway add postgresql
railway up
```

5. **Set Environment Variables:**
```bash
railway variables set JWT_SECRET=your-secret-key
railway variables set AUTH_SERVICE_URL=https://your-auth-service.railway.app
railway variables set SPRING_DATASOURCE_URL=$DATABASE_URL
railway variables set SPRING_DATASOURCE_USERNAME=$PGUSER
railway variables set SPRING_DATASOURCE_PASSWORD=$PGPASSWORD
```

### Railway Configuration Files

Create `railway.json` in each service root:

**auth-service/railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "java -jar app.jar",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**whiteboard-service/railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "java -jar app.jar",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 4. Render (Alternative Backend)

### Auth Service

1. **Create Web Service** on Render:
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/*.jar`
   - Environment: `Docker`

2. **Environment Variables:**
   - `JWT_SECRET`: Your secret key
   - `JWT_EXPIRATION`: 86400000
   - `SPRING_DATASOURCE_URL`: From PostgreSQL service
   - `SPRING_DATASOURCE_USERNAME`: From PostgreSQL service
   - `SPRING_DATASOURCE_PASSWORD`: From PostgreSQL service

### Whiteboard Service

1. **Create Web Service** on Render:
   - Build Command: `mvn clean package -DskipTests`
   - Start Command: `java -jar target/*.jar`
   - Environment: `Docker`

2. **Environment Variables:**
   - `JWT_SECRET`: Same as auth-service
   - `AUTH_SERVICE_URL`: URL of auth-service
   - `SPRING_DATASOURCE_URL`: From PostgreSQL service
   - `SPRING_DATASOURCE_USERNAME`: From PostgreSQL service
   - `SPRING_DATASOURCE_PASSWORD`: From PostgreSQL service

---

## 5. Vercel (Frontend)

### Option 1: Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

### Option 2: Vercel Dashboard

1. **Connect Repository** to Vercel
2. **Set Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: Your whiteboard service URL
   - `NEXT_PUBLIC_AUTH_API_URL`: Your auth service URL
   - `NEXT_PUBLIC_WS_URL`: Your WebSocket URL (ws:// or wss://)

3. **Build Settings:**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Vercel Configuration

Create `vercel.json` in frontend root:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@next_public_api_url",
    "NEXT_PUBLIC_AUTH_API_URL": "@next_public_auth_api_url",
    "NEXT_PUBLIC_WS_URL": "@next_public_ws_url"
  }
}
```

---

## 6. Environment Variables Reference

### Auth Service
```
JWT_SECRET=your-secret-key
JWT_EXPIRATION=86400000
SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://your-domain.com
```

### Whiteboard Service
```
JWT_SECRET=your-secret-key (same as auth-service)
JWT_EXPIRATION=86400000
AUTH_SERVICE_URL=https://your-auth-service.railway.app
SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
SPRING_FLYWAY_ENABLED=true
SPRING_FLYWAY_SCHEMAS=whiteboard
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://your-domain.com
```

### Frontend
```
NEXT_PUBLIC_API_URL=https://your-whiteboard-service.railway.app
NEXT_PUBLIC_AUTH_API_URL=https://your-auth-service.railway.app
NEXT_PUBLIC_WS_URL=wss://your-whiteboard-service.railway.app/ws
```

---

## 7. Production Checklist

- [ ] Use strong JWT_SECRET (generate with `openssl rand -hex 32`)
- [ ] Use HTTPS/WSS for all services
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure monitoring/logging
- [ ] Set up health checks
- [ ] Configure rate limiting
- [ ] Set up CI/CD pipelines
- [ ] Test WebSocket connections (wss://)
- [ ] Configure environment-specific settings

---

## 8. Quick Deploy Scripts

### Local Docker Compose
```bash
#!/bin/bash
cd /Users/mariuslungu/Projects/collabboard
docker-compose up -d
docker-compose logs -f
```

### Railway Deploy
```bash
#!/bin/bash
# Deploy auth-service
cd auth-service && railway up

# Deploy whiteboard-service
cd ../whiteboard-service && railway up

# Deploy frontend (Vercel)
cd ../frontend && vercel --prod
```

---

## 9. Troubleshooting

### Database Connection Issues
- Check database URL format
- Verify credentials
- Check firewall/network rules

### WebSocket Connection Issues
- Ensure WSS (secure) for production
- Check CORS configuration
- Verify WebSocket endpoint URL

### Build Issues
- Check Dockerfile syntax
- Verify Maven/Node versions
- Check build logs for errors
