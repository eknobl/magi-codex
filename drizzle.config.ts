import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

// drizzle-kit doesn't auto-load Next.js .env.local files
config({ path: '.env.local' });
config({ path: '.env' });

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  },
} satisfies Config;
