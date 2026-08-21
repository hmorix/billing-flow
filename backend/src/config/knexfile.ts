import type { Knex } from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: process.env.DB_CLIENT === 'mysql2' ? 'mysql2' : 'better-sqlite3',
    connection: process.env.DB_CLIENT === 'mysql2' ? {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'invoice_manager',
    } : {
      filename: path.resolve(__dirname, '../../', process.env.DB_FILE_PATH || './database.sqlite'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '../migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
    },
  },
  production: {
    client: process.env.DB_CLIENT === 'mysql2' ? 'mysql2' : 'better-sqlite3',
    connection: process.env.DB_CLIENT === 'mysql2' ? {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    } : {
      filename: path.resolve(__dirname, '../../', process.env.DB_FILE_PATH || './database.sqlite'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '../migrations'),
      tableName: 'knex_migrations',
      extension: 'ts',
    },
  }
};

export default config;
export { config };
