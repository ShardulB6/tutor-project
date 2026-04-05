import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export * from "./auth-schema";

export const users = sqliteTable("todos", {
  id: integer({ mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  title: text().notNull(),
});

export const notebooks = sqliteTable("notebook", {
  title: text().notNull(),
  id: integer({ mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  notebookID: integer("notebookID").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const message = sqliteTable("message", {
  title: text().notNull(),
  id: integer({ mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  messageID: integer("messageID").references(() => notebooks.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const messages = sqliteTable("messages", {
  id: integer({ mode: "number" }).primaryKey({
    autoIncrement: true,
  }),
  roles: text().notNull(),
  message: text().notNull(),
  messageID: integer("messageID").references(() => message.id),
});
