const { default: EmbeddedPostgres } = require('embedded-postgres');
const path = require('path');

const port = process.env.LOCAL_DB_PORT ? parseInt(process.env.LOCAL_DB_PORT, 10) : 5433;
const databaseDir = path.join(__dirname, '../.local-db');

const pg = new EmbeddedPostgres({
  port,
  databaseDir,
  user: 'postgres',
  password: 'postgrespassword',
  database: 'dogfood',
});

async function main() {
  const action = process.argv[2] || 'start';

  if (action === 'start') {
    console.log(`[Local DB] Starting embedded PostgreSQL on port ${port}...`);
    try {
      await pg.start();
      console.log(`[Local DB] ✅ PostgreSQL is running on localhost:${port} (database: dogfood)`);
      // Keep process alive if run directly
      process.on('SIGINT', async () => {
        console.log('\n[Local DB] Stopping PostgreSQL...');
        await pg.stop();
        process.exit(0);
      });
      process.on('SIGTERM', async () => {
        await pg.stop();
        process.exit(0);
      });
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        console.log(`[Local DB] ✅ PostgreSQL is already active on localhost:${port}`);
      } else {
        console.error('[Local DB] Error starting database:', err.message);
      }
    }
  } else if (action === 'stop') {
    console.log(`[Local DB] Stopping embedded PostgreSQL...`);
    try {
      await pg.stop();
      console.log(`[Local DB] ✅ PostgreSQL stopped successfully.`);
    } catch (err) {
      console.log('[Local DB] Stop result:', err.message);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { pg, port };
