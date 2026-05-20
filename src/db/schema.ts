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

export const notebookRelations = relations(NotebooksTable, ({ one }) => ({
  user: one(authSchema.user, {
    fields: [NotebooksTable.userID],
    references: [authSchema.user.id],
  }),
}));

export const SessionMessagesTable = sqliteTable(
  "assistant_messages",
  {
    tenantID: text("tenant_id").notNull(),
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
    primaryKey({ columns: [table.tenantID, table.sessionID, table.id] }),
    index("assistant_messages_tenant_session_parent_idx").on(
      table.tenantID,
      table.sessionID,
      table.parentID,
    ),
    index("assistant_messages_tenant_session_created_idx").on(
      table.tenantID,
      table.sessionID,
      table.createdAt,
    ),
  ],
);

export const SessionCompactionsTable = sqliteTable(
  "assistant_compactions",
  {
    tenantID: text("tenant_id").notNull(),
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
    primaryKey({ columns: [table.tenantID, table.sessionID, table.id] }),
    index("assistant_compactions_tenant_session_from_idx").on(
      table.tenantID,
      table.sessionID,
      table.fromMessageID,
    ),
  ],
);

export const SessionContextBlocksTable = sqliteTable(
  "assistant_context_blocks",
  {
    tenantID: text("tenant_id").notNull(),
    sessionID: text("session_id").notNull(),
    label: text("label").notNull(),
    content: text("content").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.tenantID, table.sessionID, table.label] })],
);

export const SessionSearchEntriesTable = sqliteTable(
  "assistant_search_entries",
  {
    tenantID: text("tenant_id").notNull(),
    sessionID: text("session_id").notNull(),
    label: text("label").notNull(),
    key: text("key").notNull(),
    content: text("content").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.tenantID, table.sessionID, table.label, table.key] }),
    index("assistant_search_entries_tenant_session_label_idx").on(
      table.tenantID,
      table.sessionID,
      table.label,
    ),
  ],
);
