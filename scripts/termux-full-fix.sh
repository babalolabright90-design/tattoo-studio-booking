#!/bin/bash

# Termux Tattoo Studio Booking System - Complete One-Command Fix Script
# This script fixes all common Termux install issues and sets up the app completely
# Run once: bash <(curl -fsSL https://raw.githubusercontent.com/babalolabright90-design/tattoo-studio-booking/main/scripts/termux-full-fix.sh)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="tattoo-studio-booking"
APP_DIR="$HOME/$APP_NAME"
DATA_DIR="$HOME/.local/share/tattoo-studio"
LOG_DIR="$DATA_DIR/logs"
REPO_URL="https://github.com/babalolabright90-design/tattoo-studio-booking.git"
PORT=3000

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_step() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Main script
print_header "Tattoo Studio Booking - Termux Full Fix"

# Step 1: Update system
print_step "Step 1: Updating system packages..."
pkg update -y > /dev/null 2>&1 || true
print_success "System packages updated"

# Step 2: Install dependencies
print_step "Step 2: Installing build tools and dependencies..."
pkg install -y \
    git \
    build-essential \
    clang \
    make \
    python \
    libsqlite \
    nodejs-lts \
    curl \
    wget \
    > /dev/null 2>&1 || true
print_success "Dependencies installed"

# Step 3: Configure npm
print_step "Step 3: Configuring npm..."
npm config set registry https://registry.npmjs.org/
npm config set fetch-retry-maxtimeout 600000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-timeout 600000
npm cache clean --force > /dev/null 2>&1 || true
print_success "npm configured"

# Step 4: Clone or update repo
print_step "Step 4: Setting up repository..."
if [ ! -d "$APP_DIR" ]; then
    print_step "Cloning repository..."
    cd "$HOME"
    git clone "$REPO_URL"
    print_success "Repository cloned"
else
    print_step "Repository already exists, updating..."
    cd "$APP_DIR"
    git pull origin main > /dev/null 2>&1 || true
    print_success "Repository updated"
fi

cd "$APP_DIR"

# Step 5: Clean previous installation
print_step "Step 5: Cleaning previous installation..."
rm -rf node_modules package-lock.json > /dev/null 2>&1 || true
npm cache clean --force > /dev/null 2>&1 || true
print_success "Previous installation cleaned"

# Step 6: Install npm dependencies
print_step "Step 6: Installing npm dependencies (this may take 3-5 minutes)..."
if npm install; then
    print_success "npm dependencies installed"
else
    print_error "npm install failed, retrying..."
    npm install --legacy-peer-deps || npm install --force
fi

# Step 7: Build native modules
print_step "Step 7: Building native sqlite3 module..."
if npm rebuild sqlite3 2>&1 | grep -q "gyp info ok"; then
    print_success "sqlite3 module rebuilt"
elif npm install sqlite3 --build-from-source 2>&1 | grep -q "gyp info ok"; then
    print_success "sqlite3 module installed from source"
else
    print_step "sqlite3 build may have issues, continuing..."
fi

# Step 8: Create persistent directories
print_step "Step 8: Setting up persistent storage..."
mkdir -p "$DATA_DIR/data"
mkdir -p "$LOG_DIR"
print_success "Storage directories created at $DATA_DIR"

# Step 9: Create database symlink
print_step "Step 9: Creating database symlink..."
if [ -d "$APP_DIR/data" ]; then
    rm -rf "$APP_DIR/data"
fi
if [ ! -L "$APP_DIR/data" ]; then
    ln -s "$DATA_DIR/data" "$APP_DIR/data"
    print_success "Database symlink created"
fi

# Step 10: Create .env.local
print_step "Step 10: Creating environment configuration..."
if [ ! -f "$APP_DIR/.env.local" ]; then
    cat > "$APP_DIR/.env.local" <<EOF
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
PORT=$PORT
NODE_ENV=development
EOF
    print_success ".env.local created"
else
    print_success ".env.local already exists"
fi

# Step 11: Initialize database
print_step "Step 11: Initializing database..."
if npm run db:init; then
    print_success "Database initialized"
else
    print_error "Database initialization failed"
fi

# Step 12: Make scripts executable
print_step "Step 12: Setting up management scripts..."
chmod +x "$APP_DIR/scripts"/*.sh 2>/dev/null || true
print_success "Scripts are executable"

# Step 13: Verification
print_step "Step 13: Verifying installation..."
echo ""

# Check Node
NODE_VERSION=$(node -v)
echo "  Node.js: $NODE_VERSION"

# Check npm
NPM_VERSION=$(npm -v)
echo "  npm: $NPM_VERSION"

# Check directories
if [ -d "$APP_DIR/node_modules" ]; then
    echo "  node_modules: ✓"
else
    echo "  node_modules: ✗"
fi

# Check database
if [ -f "$DATA_DIR/data/studio.db" ]; then
    DB_SIZE=$(du -h "$DATA_DIR/data/studio.db" | cut -f1)
    echo "  Database: ✓ ($DB_SIZE)"
else
    echo "  Database: ✗ (will be created on first run)"
fi

# Check config
if [ -f "$APP_DIR/.env.local" ]; then
    echo "  Configuration: ✓"
else
    echo "  Configuration: ✗"
fi

echo ""

# Final summary
print_header "Installation Complete!"

echo -e "${GREEN}Your app is ready to run!${NC}\n"

echo -e "${BLUE}Quick Start (choose one):${NC}\n"

echo "1. Run directly (foreground):"
echo -e "   ${YELLOW}cd $APP_DIR${NC}"
echo -e "   ${YELLOW}npm run dev -- --hostname 0.0.0.0 --port $PORT${NC}"
echo ""

echo "2. Run in tmux (background):"
echo -e "   ${YELLOW}cd $APP_DIR${NC}"
echo -e "   ${YELLOW}bash scripts/tmux-start.sh${NC}"
echo ""

echo "3. Check status:"
echo -e "   ${YELLOW}bash $APP_DIR/scripts/tmux-status.sh${NC}"
echo ""

echo -e "${BLUE}Access the app:${NC}\n"
echo "  Booking: http://127.0.0.1:$PORT"
echo "  Admin:   http://127.0.0.1:$PORT/admin"
echo ""

echo -e "${BLUE}Admin credentials:${NC}\n"
echo "  Email:    admin@inkandbonestudio.com"
echo "  Password: password123"
echo ""

echo -e "${BLUE}Important paths:${NC}\n"
echo "  App:      $APP_DIR"
echo "  Database: $DATA_DIR/data/studio.db"
echo "  Logs:     $LOG_DIR/"
echo ""

echo -e "${BLUE}Useful commands:${NC}\n"
echo "  Start:      bash $APP_DIR/scripts/tmux-start.sh"
echo "  Stop:       bash $APP_DIR/scripts/tmux-stop.sh"
echo "  Status:     bash $APP_DIR/scripts/tmux-status.sh"
echo "  View logs:  bash $APP_DIR/scripts/tmux-logs.sh"
echo "  Restart:    bash $APP_DIR/scripts/tmux-restart.sh"
echo ""

echo -e "${GREEN}Ready to go! Start the app now.${NC}\n"
