#!/bin/bash

# ============================================================
# AI Construction Wearable Safety Monitor - Start Script
# ============================================================
# This script:
#   1. Kills any processes on ports 3000 and 3001
#   2. Ensures PostgreSQL is running
#   3. Creates the database if it doesn't exist
#   4. Installs dependencies
#   5. Seeds the database
#   6. Starts backend (with nodemon for hot reload) and frontend
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   AI Construction Wearable Safety Monitor               ║"
echo "║   Starting Application...                               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Step 1: Clean up used ports ----
echo -e "${YELLOW}[1/6] Cleaning up ports 3000 and 3001...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${RED}Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  ${GREEN}Port $port is free${NC}"
  fi
}

cleanup_port 3000
cleanup_port 3001

# ---- Step 2: Check PostgreSQL ----
echo -e "${YELLOW}[2/6] Checking PostgreSQL...${NC}"

if command -v pg_isready &> /dev/null; then
  if pg_isready -q 2>/dev/null; then
    echo -e "  ${GREEN}PostgreSQL is running${NC}"
  else
    echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
    if pg_isready -q 2>/dev/null; then
      echo -e "  ${GREEN}PostgreSQL started successfully${NC}"
    else
      echo -e "  ${RED}Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    fi
  fi
else
  echo -e "  ${YELLOW}pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ---- Step 3: Create database if not exists ----
echo -e "${YELLOW}[3/6] Ensuring database exists...${NC}"

DB_NAME="construction_safety"
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo -e "  ${GREEN}Database '$DB_NAME' already exists${NC}"
else
  echo -e "  ${BLUE}Creating database '$DB_NAME'...${NC}"
  createdb "$DB_NAME" 2>/dev/null || psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
  echo -e "  ${GREEN}Database created${NC}"
fi

# ---- Step 4: Install dependencies ----
echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"

echo -e "  ${BLUE}Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
npm install --silent 2>&1 | tail -1

echo -e "  ${BLUE}Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install --silent 2>&1 | tail -1

# ---- Step 5: Seed the database ----
echo -e "${YELLOW}[5/6] Seeding database with sample data...${NC}"
cd "$BACKEND_DIR"
node seed.js

# ---- Step 6: Start the application ----
echo -e "${YELLOW}[6/6] Starting application...${NC}"

# Start backend with nodemon for hot reload
echo -e "  ${BLUE}Starting backend on port 3001 (with hot reload)...${NC}"
cd "$BACKEND_DIR"
npx nodemon server.js &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start frontend (React dev server has built-in hot reload)
echo -e "  ${BLUE}Starting frontend on port 3000 (with hot reload)...${NC}"
cd "$FRONTEND_DIR"
BROWSER=none PORT=3000 npm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗"
echo -e "║   Application Started Successfully!                     ║"
echo -e "║                                                          ║"
echo -e "║   Frontend:  http://localhost:3000                       ║"
echo -e "║   Backend:   http://localhost:3001                       ║"
echo -e "║                                                          ║"
echo -e "║   Demo Login:                                            ║"
echo -e "║     Email:    demo@safety.com                            ║"
echo -e "║     Password: password123                                ║"
echo -e "║                                                          ║"
echo -e "║   Hot reload is enabled for both frontend and backend.   ║"
echo -e "║   Press Ctrl+C to stop all services.                     ║"
echo -e "╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Handle Ctrl+C gracefully
trap "echo -e '\n${RED}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; cleanup_port 3000; cleanup_port 3001; echo -e '${GREEN}Goodbye!${NC}'; exit 0" SIGINT SIGTERM

# Wait for both processes
wait
