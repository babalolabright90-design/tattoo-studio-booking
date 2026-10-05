const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'studio.db');

async function ensureDatabase() {
  fs.mkdirSync(DB_DIR, { recursive: true });

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      client_email TEXT NOT NULL,
      service_type TEXT NOT NULL,
      design_idea TEXT,
      booking_date TEXT NOT NULL,
      booking_time TEXT NOT NULL,
      appointment_duration INTEGER NOT NULL DEFAULT 60,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@inkandbonestudio.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

  const existingAdmin = await db.get('SELECT * FROM admin_users WHERE email = ?', [adminEmail]);

  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await db.run(
      'INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)',
      [adminEmail, hash, 'Studio Manager']
    );
  }

  await db.close();
}

async function getDb() {
  await ensureDatabase();
  return open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
}

module.exports = { getDb, ensureDatabase, DB_PATH };
