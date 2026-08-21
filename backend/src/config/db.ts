import knex from 'knex';
import config from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

const db = knex(dbConfig);

// Enable foreign keys for SQLite (not enabled by default in SQLite)
if (process.env.DB_CLIENT !== 'mysql2') {
  db.raw('PRAGMA foreign_keys = ON;')
    .then(() => {
      console.log('SQLite Foreign Keys enabled');
    })
    .catch((err) => {
      console.error('Failed to enable SQLite foreign keys:', err);
    });
}

export default db;
export { db };
