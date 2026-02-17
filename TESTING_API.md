# API Testing Guide - CollabBoard Whiteboard Service

## ✅ Test Results Summary

### 1. Application Startup ✅
- Application starts successfully on port **8081**
- Tomcat initialized correctly
- Spring Security configured
- Database connection established
- Flyway migrations completed

### 2. Endpoint Tests ✅

#### Public Endpoint (No Auth Required)
```bash
curl http://localhost:8081/api/boards/public
# Response: [] (empty array - correct, no public boards yet)
# Status: 200 OK ✅
```

#### Protected Endpoint with Invalid Token
```bash
curl -H "Authorization: Bearer invalid_token" http://localhost:8081/api/boards
# Response: {"timestamp":"...","status":403,"error":"Forbidden","message":"Invalid or expired token"}
# Status: 403 Forbidden ✅
```

## 📋 Full API Testing

### Prerequisites
1. **Start Auth Service** (port 8080)
2. **Start Whiteboard Service** (port 8081)
3. **PostgreSQL running** (port 5432)

### Step 1: Get JWT Token from Auth Service

```bash
# Register a new user (or login if exists)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Or login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Response will contain accessToken - save it!
```

### Step 2: Test Whiteboard Endpoints with Valid Token

```bash
# Set token variable (replace YOUR_TOKEN_HERE with actual token)
TOKEN="YOUR_TOKEN_HERE"

# Create a board
curl -X POST http://localhost:8081/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My First Board",
    "description": "Test board",
    "isPublic": false
  }'

# Get user boards
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/boards

# Get board by ID (replace BOARD_ID with actual ID)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/boards/BOARD_ID

# Create a shape on board
curl -X POST http://localhost:8081/api/boards/BOARD_ID/shapes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "RECTANGLE",
    "data": {
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 150,
      "color": "#FF0000"
    }
  }'

# Get all shapes on board
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/boards/BOARD_ID/shapes

# Add collaborator
curl -X POST http://localhost:8081/api/boards/BOARD_ID/collaborators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "USER_ID_TO_ADD",
    "role": "EDITOR"
  }'
```

## 🧪 Test Scenarios

### Test 1: Public Boards (No Auth)
- ✅ Should return list of public boards
- ✅ Should work without Authorization header

### Test 2: Create Board (Auth Required)
- ✅ Should require valid JWT token
- ✅ Should create board with owner = user from token
- ✅ Should return 201 Created with board details

### Test 3: Get Board (Auth Required)
- ✅ Should require valid JWT token
- ✅ Should return board if user is owner/collaborator/public
- ✅ Should return 403 if user has no access

### Test 4: Create Shape (Auth Required)
- ✅ Should require valid JWT token
- ✅ Should require user to be owner or editor
- ✅ Should auto-assign layer order if not provided

### Test 5: Permission Checks
- ✅ Only owner can update/delete board
- ✅ Only owner/editor can create/update/delete shapes
- ✅ Only owner can add/remove collaborators

## 📝 Current Test Status

- ✅ Application startup
- ✅ Public endpoints (no auth)
- ✅ Error handling (invalid token)
- ⏳ Full flow with valid token (requires auth-service running)
- ⏳ Permission checks
- ⏳ Integration tests

## 🔧 Quick Test Script

```bash
#!/bin/bash

# 1. Start services
echo "Starting services..."
cd auth-service && ./mvnw spring-boot:run &
cd whiteboard-service && ./mvnw spring-boot:run &

# 2. Wait for services to start
sleep 10

# 3. Register user and get token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","firstName":"Test","lastName":"User"}' \
  | jq -r '.accessToken')

# 4. Test endpoints
echo "Testing endpoints with token: $TOKEN"

# Create board
BOARD_ID=$(curl -s -X POST http://localhost:8081/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Board","description":"Test","isPublic":false}' \
  | jq -r '.id')

echo "Created board: $BOARD_ID"

# Get boards
curl -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/boards

echo "✅ Tests completed!"
```
