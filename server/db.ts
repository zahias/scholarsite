import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Remove any SSL params from connection string and explicitly disable SSL
// A2 Hosting PostgreSQL does not support SSL connections
let connectionString = process.env.DATABASE_URL || '';
connectionString = connectionString
  .replace(/[?&]sslmode=[^&]*/gi, '')
  .replace(/[?&]ssl=[^&]*/gi, '');

console.log('Database connection initialized (SSL disabled for A2 Hosting compatibility)');

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: false
});

export const db = drizzle(pool, { schema });
