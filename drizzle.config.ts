import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 1. Support multiple env files (loads .env.local first, falls back to .env)
dotenv.config({ path: ['.env.local', '.env'] });

// 2. Fail fast: Validate critical environment variables before execution
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    '❌ DATABASE_URL environment variable is missing. Please ensure it is set in your .env.local or .env file.'
  );
}

// 3. Use `defineConfig` for better IDE autocomplete and type inference
export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  
  // 4. Industry standard safety nets for migrations
  verbose: true, // Logs all SQL statements execution for easier debugging
  strict: true,  // Prompts for confirmation before executing statements that drop data or truncate tables
});