import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://dashboard_api:password@localhost:5432/dashboard',
  },
  verbose: true,
  strict: true,
} satisfies Config;