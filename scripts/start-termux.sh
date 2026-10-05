#!/bin/bash

# Termux tattoo studio booking system startup script
# Auto-runs the app in the background with persistent database storage

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="tattoo-studio-booking"
DATA_DIR="$HOME/.local/share/tattoo-studio"
LOG_DIR="$DATA_DIR/logs"
LOG_FILE="$LOG_DIR/server.log"
PID_FILE="$DATA_DIR/server.pid"
PORT=3000

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Tattoo Studio Booking System - Termux Startup${NC}"
echo "=================================================="

# Create persistent directories
echo -e "${YELLOW}Setting up persistent storage...${NC}"
mkdir -p "$DATA_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$DATA_DIR/data"

# Check if app directory exists
if [ ! -d "$SCRIPT_DIR" ]; then
    echo -e "${RED}Error: App directory not found at $SCRIPT_DIR${NC}"
    exit 1
fi

cd "$SCRIPT_DIR"

# Create symlink for database to persistent storage
if [ ! -L "data" ] && [ -d "data" ]; then
    echo -e "${YELLOW}Moving existing database to persistent storage...${NC}"
    mv data/* "$DATA_DIR/data/" 2>/dev/null || true
    rm -rf data
fi

if [ ! -L "data" ]; then
    echo -e "${YELLOW}Creating database symlink...${NC}"
    ln -s "$DATA_DIR/data" data
fi

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}App is already running (PID: $OLD_PID)${NC}"
        echo "Log file: $LOG_FILE"
        exit 0
    fi
fi

# Install/update dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install 2>&1 | tee -a "$LOG_FILE"
fi

# Initialize database if not exists
if [ ! -f "$DATA_DIR/data/studio.db" ]; then
    echo -e "${YELLOW}Initializing database...${NC}"
    npm run db:init 2>&1 | tee -a "$LOG_FILE"
fi

# Build if needed
if [ ! -d ".next" ]; then
    echo -e "${YELLOW}Building application...${NC}"
    npm run build 2>&1 | tee -a "$LOG_FILE"
fi

# Start the app in the background
echo -e "${YELLOW}Starting application on port $PORT...${NC}"
nohup npm run start -- --hostname 0.0.0.0 --port $PORT > "$LOG_FILE" 2>&1 &
APP_PID=$!

# Save PID
echo $APP_PID > "$PID_FILE"

# Wait a moment for startup
sleep 2

# Check if process started successfully
if ps -p "$APP_PID" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ App started successfully (PID: $APP_PID)${NC}"
    echo ""
    echo -e "${GREEN}Access the app at:${NC}"
    echo "  - Local: http://127.0.0.1:$PORT"
    echo "  - Network: http://<your-android-ip>:$PORT"
    echo ""
    echo -e "${GREEN}Admin dashboard:${NC}"
    echo "  - http://127.0.0.1:$PORT/admin"
    echo "  - Email: admin@inkandbonestudio.com"
    echo "  - Password: password123"
    echo ""
    echo -e "${GREEN}Database location:${NC}"
    echo "  - $DATA_DIR/data/studio.db"
    echo ""
    echo -e "${GREEN}Log file:${NC}"
    echo "  - $LOG_FILE"
    echo ""
    echo -e "${GREEN}To stop the app, run:${NC}"
    echo "  - bash scripts/stop.sh"
    echo ""
    echo -e "${GREEN}To view logs, run:${NC}"
    echo "  - tail -f $LOG_FILE"
else
    echo -e "${RED}✗ Failed to start app. Check logs:${NC}"
    cat "$LOG_FILE"
    exit 1
fi
