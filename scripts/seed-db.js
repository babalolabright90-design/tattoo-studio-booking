const { initDatabase } = require('./init-db');

async function main() {
  await initDatabase();
  console.log('Database initialized successfully.');
}

main().catch((error) => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});
