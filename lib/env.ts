import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ADMIN_SESSION_SECRET: z.string().min(32).optional(),
  REDIS_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
