import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Allow disabling SSL via DB_SSL=false for hosts that don't support it (like A2 Hosting)
const sslConfig = process.env.DB_SSL === 'false' 
  ? false 
  : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig
});

export const db = drizzle(pool, { schema });
