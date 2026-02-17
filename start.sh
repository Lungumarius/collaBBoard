#!/bin/bash

# CollabBoard - Quick Start Script
# This script starts all services for local development

echo "🚀 Starting CollabBoard..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! docker ps | grep -q collabboard-postgres; then
    echo -e "${YELLOW}📦 Starting PostgreSQL...${NC}"
    cd "$(dirname "$0")"
    docker-compose up -d postgres
    echo -e "${GREEN}✅ PostgreSQL started${NC}"
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
else
    echo -e "${GREEN}✅ PostgreSQL is already running${NC}"
fi

# Check if services are already running
if lsof -ti:8080 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 8080 is already in use (Auth Service)${NC}"
fi

if lsof -ti:8081 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 8081 is already in use (Whiteboard Service)${NC}"
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use (Frontend)${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Ready to start services!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To start all services, open 4 terminals and run:"
echo ""
echo -e "${YELLOW}Terminal 1 - PostgreSQL (already started):${NC}"
echo "  docker-compose up -d postgres"
echo ""
echo -e "${YELLOW}Terminal 2 - Auth Service:${NC}"
echo "  cd auth-service && ./mvnw spring-boot:run"
echo ""
echo -e "${YELLOW}Terminal 3 - Whiteboard Service:${NC}"
echo "  cd whiteboard-service && ./mvnw spring-boot:run"
echo ""
echo -e "${YELLOW}Terminal 4 - Frontend:${NC}"
echo "  cd frontend && npm run dev"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📍 URLs after starting:${NC}"
echo "  • Frontend:      http://localhost:3000"
echo "  • Auth Service:  http://localhost:8080"
echo "  • Whiteboard:    http://localhost:8081"
echo "  • PostgreSQL:    localhost:5432"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
