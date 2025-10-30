import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql" as const,
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "user",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "unified_planner"
  }
} satisfies Config;
