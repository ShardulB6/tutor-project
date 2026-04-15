import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import crypto from "node:crypto";
import * as authSchema from "./auth-schema";
import { z } from "zod";
export * from "./auth-schema";

export type NotebookId = string & z.$brand<"NotebookId">;
export type ThreadId = string & z.$brand<"ThreadId">;
export type MessageId = string & z.$brand<"MessageId">;

export const NotebooksTable = sqliteTable("notebook", {
  title: text().notNull(),
  id: text("id")
    .$type<NotebookId>()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID() as NotebookId),
  userID: text("userID").references(() => authSchema.user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const ThreadsTable = sqliteTable("threads", {
  title: text().notNull(),
  id: text("id")
    .$type<ThreadId>()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID() as ThreadId),
  notebookID: text("notebookID")
    .$type<NotebookId>()
    .references(() => NotebooksTable.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const MessagesTable = sqliteTable("messages", {
  id: text("id")
    .$type<MessageId>()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID() as MessageId),
  roles: text().notNull(),
  message: text().notNull(),
  threadID: text("threadID")
    .$type<ThreadId>()
    .references(() => ThreadsTable.id),
});
