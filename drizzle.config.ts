import type { Config } from 'drizzle-kit';

export default {
  schema: './src/app/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;