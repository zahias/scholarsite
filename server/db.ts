import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL || '';

// Determine SSL configuration based on database host
// Neon databases require SSL, A2 Hosting local PostgreSQL does not
const isNeonDatabase = connectionString.includes('neon.tech') || connectionString.includes('neon.com');

console.log(`Database connection initialized (SSL ${isNeonDatabase ? 'enabled' : 'disabled'})`);

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: isNeonDatabase ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });
