import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import crypto from "node:crypto";
import * as authSchema from "./auth-schema";
export * from "./auth-schema";

export const notebooks = sqliteTable("notebook", {
  title: text().notNull(),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userID: integer("userID").references(() => authSchema.user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const threads = sqliteTable("threads", {
  title: text().notNull(),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  notebookID: integer("notebookID").references(() => notebooks.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const messages = sqliteTable("messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  roles: text().notNull(),
  message: text().notNull(),
  threadID: integer("threadID").references(() => threads.id),
});
