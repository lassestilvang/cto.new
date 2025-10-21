export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "dev-secret",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL ?? "",
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN ?? "",
  USE_DEMO_DATA: process.env.USE_DEMO_DATA ?? "true"
};

export function isDemo() {
  return env.USE_DEMO_DATA !== "false" || (!env.DATABASE_URL || !env.UPSTASH_REDIS_URL);
}
