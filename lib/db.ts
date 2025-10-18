import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import { env, isDemo } from "@/lib/env";

export type DB = ReturnType<typeof drizzle<typeof schema>>;

let db: DB | null = null;

export function getDb(): DB | null {
  if (isDemo()) return null;
  if (!db) {
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    const sql = neon(env.DATABASE_URL);
    db = drizzle(sql, { schema });
  }
  return db;
}
