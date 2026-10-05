#!/bin/bash

# Termux Tattoo Studio Booking System - Complete Fix & Install Script
# Run this once to fix npm install errors and set up the app completely

set -e

echo "=========================================="
echo "Tattoo Studio Booking - Termux Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Update and install system dependencies
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
pkg update -y > /dev/null 2>&1 || true

echo -e "${YELLOW}[2/10] Installing build tools...${NC}"
pkg install -y git build-essential clang make python libsqlite nodejs-lts > /dev/null 2>&1 || true

# Step 2: Set up npm registry and config
echo -e "${YELLOW}[3/10] Configuring npm...${NC}"
npm config set registry https://registry.npmjs.org/
npm config set fetch-retry-maxtimeout 600000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-timeout 600000

# Step 3: Navigate to project directory
APP_DIR="$HOME/tattoo-studio-booking"

if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}[4/10] Cloning repository...${NC}"
    cd ~
    git clone https://github.com/babalolabright90-design/tattoo-studio-booking.git
else
    echo -e "${YELLOW}[4/10] Repository already exists, skipping clone...${NC}"
fi

cd "$APP_DIR"

# Step 4: Clean previous install
echo -e "${YELLOW}[5/10] Cleaning previous installation...${NC}"
rm -rf node_modules package-lock.json > /dev/null 2>&1 || true
npm cache clean --force > /dev/null 2>&1 || true

# Step 5: Install dependencies
echo -e "${YELLOW}[6/10] Installing npm dependencies (this may take 2-3 minutes)...${NC}"
npm install

# Step 6: Rebuild sqlite3 native module
echo -e "${YELLOW}[7/10] Building native sqlite3 module...${NC}"
npm rebuild sqlite3 2>&1 || npm install sqlite3 --build-from-source 2>&1 || true

# Step 7: Create persistent data directory
echo -e "${YELLOW}[8/10] Setting up persistent data storage...${NC}"
mkdir -p ~/.local/share/tattoo-studio/data
mkdir -p ~/.local/share/tattoo-studio/logs

# Link data directory if not already linked
if [ ! -L "$APP_DIR/data" ]; then
    rm -rf "$APP_DIR/data" 2>/dev/null || true
    ln -s ~/.local/share/tattoo-studio/data "$APP_DIR/data"
fi

# Step 8: Initialize database
echo -e "${YELLOW}[9/10] Initializing database...${NC}"
npm run db:init

# Step 9: Create .env.local if it doesn't exist
if [ ! -f "$APP_DIR/.env.local" ]; then
    echo -e "${YELLOW}[10/10] Creating environment configuration...${NC}"
    cat > "$APP_DIR/.env.local" <<'EOF'
NEXT_PUBLIC_STUDIO_NAME=Ink & Bone Studio
NEXT_PUBLIC_STUDIO_HOURS=10:00-18:00
NEXT_PUBLIC_STUDIO_CLOSED_DAYS=Sunday,Monday
ADMIN_EMAIL=admin@inkandbonestudio.com
ADMIN_PASSWORD=password123
JWT_SECRET=tattoo-studio-secret-key-termux
EMAIL_SERVICE=console
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=bookings@inkandbonestudio.com
HOSTNAME=0.0.0.0
PORT=3000
NODE_ENV=development
EOF
fi

echo ""
echo -e "${GREEN}=========================================="
echo "✓ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Start the app with:"
echo "   npm run dev -- --hostname 0.0.0.0 --port 3000"
echo ""
echo "2. Open in browser:"
echo "   http://127.0.0.1:3000"
echo ""
echo "3. Admin dashboard:"
echo "   http://127.0.0.1:3000/admin"
echo ""
echo -e "${GREEN}Admin credentials:${NC}"
echo "   Email: admin@inkandbonestudio.com"
echo "   Password: password123"
echo ""
echo -e "${GREEN}Database location:${NC}"
echo "   ~/.local/share/tattoo-studio/data/studio.db"
echo ""
echo -e "${GREEN}To run with tmux (keeps running in background):${NC}"
echo "   tmux new -s tattoo"
echo "   npm run dev -- --hostname 0.0.0.0 --port 3000"
echo "   # Press Ctrl+B then D to detach"
echo ""
echo -e "${GREEN}To reattach tmux session:${NC}"
echo "   tmux attach -t tattoo"
echo ""
echo -e "${GREEN}To stop tmux session:${NC}"
echo "   tmux kill-session -t tattoo"
echo ""
