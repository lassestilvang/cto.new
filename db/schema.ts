import { pgTable, text, timestamp, boolean, varchar, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const accounts = pgTable("accounts", {
  userId: varchar("user_id", { length: 191 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  expires_at: timestamp("expires_at"),
}, (t) => ({
  pk: primaryKey({ columns: [t.provider, t.providerAccountId] })
}));

export const sessions = pgTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 191 }).notNull(),
  expires: timestamp("expires").notNull()
});

export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  dueDate: timestamp("due_date"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  completed: boolean("completed").default(false).notNull(),
  priority: varchar("priority", { length: 20 }).default("medium").notNull(),
  subtasks: jsonb("subtasks").$type<{ id: string; title: string; completed: boolean }[]>(),
  sharedWith: jsonb("shared_with").$type<string[]>(),
  userId: varchar("user_id", { length: 191 }).notNull()
});

export const events = pgTable("events", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  allDay: boolean("all_day").default(false).notNull(),
  attendees: jsonb("attendees").$type<string[]>(),
  sharedLabel: varchar("shared_label", { length: 255 }),
  source: varchar("source", { length: 50 }).default("local").notNull(),
  userId: varchar("user_id", { length: 191 }).notNull()
});
