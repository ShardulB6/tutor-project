import { relations, sql } from "drizzle-orm";
import { sqliteTable, integer, text, index, primaryKey } from "drizzle-orm/sqlite-core";
import crypto from "node:crypto";
import * as authSchema from "./auth-schema";
import { z } from "zod";
export * from "./auth-schema";

export type NotebookId = string & z.$brand<"NotebookId">;

const timestamspColums = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`)
    .notNull(),
};

export const NotebooksTable = sqliteTable("notebook", {
  title: text().notNull(),
  id: text("id")
    .$type<NotebookId>()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID() as NotebookId),
  userID: text("userID")
    .references(() => authSchema.user.id)
    .notNull(),
  ...timestamspColums,
});

export const notebookRelations = relations(NotebooksTable, ({ one, many }) => ({
  user: one(authSchema.user, {
    fields: [NotebooksTable.userID],
    references: [authSchema.user.id],
  }),
  sessionMessages: many(SessionMessagesTable),
}));

export const ChatSessionsTable = sqliteTable("chat_sessions", {
  sessionID: text("session_id").primaryKey(),
  name: text("name").notNull(),
});

export const SessionMessagesTable = sqliteTable(
  "assistant_messages",
  {
    notebookID: text("notebook_id")
      .references(() => NotebooksTable.id, { onDelete: "cascade" })
      .notNull(),
    sessionID: text("session_id").notNull(),
    id: text("id").notNull(),
    parentID: text("parent_id"),
    role: text("role").notNull(),
    content: text("content").notNull(),
    textContent: text("text_content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.notebookID, table.sessionID, table.id] }),
    index("assistant_messages_notebook_session_parent_idx").on(
      table.notebookID,
      table.sessionID,
      table.parentID,
    ),
    index("assistant_messages_notebook_session_created_idx").on(
      table.notebookID,
      table.sessionID,
      table.createdAt,
    ),
  ],
);

export const sessionMessagesRelations = relations(SessionMessagesTable, ({ one }) => ({
  notebook: one(NotebooksTable, {
    fields: [SessionMessagesTable.notebookID],
    references: [NotebooksTable.id],
  }),
}));

export const SessionCompactionsTable = sqliteTable(
  "assistant_compactions",
  {
    notebookID: text("notebook_id")
      .references(() => NotebooksTable.id, { onDelete: "cascade" })
      .notNull(),
    sessionID: text("session_id").notNull(),
    id: text("id").notNull(),
    summary: text("summary").notNull(),
    fromMessageID: text("from_message_id").notNull(),
    toMessageID: text("to_message_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.notebookID, table.sessionID, table.id] }),
    index("assistant_compactions_notebook_session_from_idx").on(
      table.notebookID,
      table.sessionID,
      table.fromMessageID,
    ),
  ],
);
