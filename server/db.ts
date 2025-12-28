import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

export let pool: any = undefined;
export let db: any = undefined;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set - running in development fallback mode (no DB).');
} else {
  const connectionString = process.env.DATABASE_URL || '';

  // Determine SSL configuration based on database host
  // Neon databases require SSL, A2 Hosting local PostgreSQL does not
  const isNeonDatabase = connectionString.includes('neon.tech') || connectionString.includes('neon.com');

  console.log(`Database connection initialized (SSL ${isNeonDatabase ? 'enabled' : 'disabled'})`);

  pool = new Pool({ 
    connectionString: connectionString,
    ssl: isNeonDatabase ? { rejectUnauthorized: false } : false
  });

  db = drizzle(pool, { schema });
}
