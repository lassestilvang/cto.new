import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional().default(''),
  NEXTAUTH_SECRET: z.string().optional().default('dev-secret'),
  NEXTAUTH_URL: z.string().optional().default('http://localhost:3000'),
  UPSTASH_REDIS_URL: z.string().optional().default(''),
  UPSTASH_REDIS_TOKEN: z.string().optional().default(''),
  USE_DEMO_DATA: z.string().optional().default('true')
}).transform((env) => ({
  DATABASE_URL: env.DATABASE_URL || '',
  NEXTAUTH_SECRET: env.NEXTAUTH_SECRET || 'dev-secret',
  NEXTAUTH_URL: env.NEXTAUTH_URL || 'http://localhost:3000',
  UPSTASH_REDIS_URL: env.UPSTASH_REDIS_URL || '',
  UPSTASH_REDIS_TOKEN: env.UPSTASH_REDIS_TOKEN || '',
  USE_DEMO_DATA: env.USE_DEMO_DATA === 'true'
}));

export const env = envSchema.parse(process.env);

export function isDemo() {
  return env.USE_DEMO_DATA || (!env.DATABASE_URL || !env.UPSTASH_REDIS_URL);
}
