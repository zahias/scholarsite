import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Determine SSL configuration
// Default to no SSL unless DB_SSL=true is explicitly set
// Most self-hosted PostgreSQL (like A2 Hosting) don't support SSL
const dbUrl = process.env.DATABASE_URL || '';
const requiresSSL = process.env.DB_SSL === 'true' || dbUrl.includes('sslmode=require');
const sslConfig = requiresSSL ? { rejectUnauthorized: false } : false;

console.log(`Database SSL mode: ${requiresSSL ? 'enabled' : 'disabled'}`);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
