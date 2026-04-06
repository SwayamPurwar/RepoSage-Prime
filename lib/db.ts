import { neon, neonConfig } from '@neondatabase/serverless' 
import { drizzle } from 'drizzle-orm/neon-http' 
import * as schema from './schema' // Import schema for relational queries

// Optional: cache connections if using fetch-based edge functions
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!) 

// Use global singleton in development to prevent connection exhaustion during HMR
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined
}

export const db = globalForDb.db ?? drizzle(sql, { schema })

if (process.env.NODE_ENV !== 'production') globalForDb.db = db