import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import crypto from "node:crypto";
import * as authSchema from "./auth-schema";
export * from "./auth-schema";

type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type NotebookId = Brand<string, "NotebookId">;
export type ThreadId = Brand<string, "ThreadId">;
export type MessageId = Brand<string, "MessageId">;
export type FilePart = {
  type: "file";
  fileName: string;
  mediaType: string;
  url: string;
};

export const notebooks = sqliteTable("notebook", {
  title: text().notNull(),
  id: text("id")
    .$type<NotebookId>()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID() as NotebookId),
  userID: text("userID")
    .$type<authSchema.UserId>()
    .references(() => authSchema.user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const threads = sqliteTable("threads", {
  title: text().notNull(),
  id: text("id")
    .$type<ThreadId>()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID() as ThreadId),
  notebookID: text("notebookID")
    .$type<NotebookId>()
    .references(() => notebooks.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});

export const messages = sqliteTable("messages", {
  id: text("id")
    .$type<MessageId>()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID() as MessageId),
  roles: text().notNull(),
  message: text().notNull(),
  fileparts: text("fileparts", { mode: "json" })
    .$type<FilePart[] | null>()
    .default(sql`null`),
  threadID: text("threadID")
    .$type<ThreadId>()
    .references(() => threads.id),
});

export const Pdf = sqliteTable("pdf", {
  id: text("id")
    .$type<string>()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text().notNull(),
  data: text().notNull(),
  userID: text("userID")
    .$type<authSchema.UserId>()
    .references(() => authSchema.user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updateat: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
});
