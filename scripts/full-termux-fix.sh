#!/bin/bash

# Full Termux fix for the tattoo studio booking app
# Handles dependency installation, native build issues, database setup, and app startup.

set -e

APP_DIR="$HOME/tattoo-studio-booking"
DATA_DIR="$HOME/.local/share/tattoo-studio"
LOG_DIR="$DATA_DIR/logs"
LOG_FILE="$LOG_DIR/tattoo.log"
PORT=3000
REPO_URL="https://github.com/babalolabright90-design/tattoo-studio-booking.git"

mkdir -p "$LOG_DIR"

echo "===================================================="
echo "Tattoo Studio Booking - Full Termux Fix"
echo "===================================================="

# Update packages
pkg update -y > /dev/null 2>&1 || true
pkg install -y git build-essential clang make python libsqlite nodejs-lts curl wget > /dev/null 2>&1 || true

echo "[1/8] Ensuring app directory exists..."
if [ ! -d "$APP_DIR" ]; then
  cd "$HOME"
  git clone "$REPO_URL"
fi

cd "$APP_DIR"

echo "[2/8] Cleaning previous installation..."
rm -rf node_modules package-lock.json > /dev/null 2>&1 || true
npm cache clean --force > /dev/null 2>&1 || true

# Setup npm config
npm config set registry https://registry.npmjs.org/
npm config set fetch-retry-maxtimeout 600000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-timeout 600000

echo "[3/8] Installing dependencies..."
npm install 2>&1 | tee -a "$LOG_FILE"

echo "[4/8] Rebuilding sqlite3 native module..."
# Try several standard rebuild routes
npm rebuild sqlite3 2>&1 | tee -a "$LOG_FILE" || true
npm install sqlite3 --build-from-source 2>&1 | tee -a "$LOG_FILE" || true

# If sqlite3 still fails, remove and reinstall
if [ ! -d "$APP_DIR/node_modules/sqlite3" ]; then
  echo "sqlite3 missing after install, retrying..."
  npm install sqlite3 --legacy-peer-deps --build-from-source 2>&1 | tee -a "$LOG_FILE" || true
fi

echo "[5/8] Creating persistent storage folders..."
mkdir -p "$DATA_DIR/data"
if [ ! -L "$APP_DIR/data" ]; then
  rm -rf "$APP_DIR/data" 2>/dev/null || true
  ln -s "$DATA_DIR/data" "$APP_DIR/data"
fi

echo "[6/8] Creating .env.local if needed..."
if [ ! -f "$APP_DIR/.env.local" ]; then
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

echo "[7/8] Initializing database..."
npm run db:init 2>&1 | tee -a "$LOG_FILE"

echo "[8/8] Setting executable permissions..."
chmod +x "$APP_DIR"/scripts/*.sh 2>/dev/null || true

echo ""
echo "===================================================="
echo "Setup complete."
echo "===================================================="
echo "Run the app with:"
echo "  cd $APP_DIR"
echo "  npm run dev -- --hostname 0.0.0.0 --port $PORT"
echo ""
echo "Admin login:"
echo "  email: admin@inkandbonestudio.com"
echo "  password: password123"
echo ""
echo "Database location: $DATA_DIR/data/studio.db"
echo "Log file: $LOG_FILE"
echo ""
