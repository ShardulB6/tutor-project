import { relations, sql } from "drizzle-orm";
import { sqliteTable, integer, text, index, primaryKey } from "drizzle-orm/sqlite-core";
import crypto from "node:crypto";
import * as authSchema from "./auth-schema";
import { z } from "zod";
import {
  timestampColumns,
  NotebooksTable,
  notebookRelations,
  ChatSessionsTable,
  SessionMessagesTable,
  sessionMessagesRelations,
  SessionCompactionsTable,
} from "./schema";
export * from "./auth-schema";

export const files = sqliteTable("files", {
  title: text().notNull(),
  id: text("id").notNull(),
  notebookID: text("notebook_id")
    .references(() => NotebooksTable.id, { onDelete: "cascade" })
    .notNull(),
  userID: text("userID")
    .references(() => authSchema.user.id)
    .notNull(),
  size: integer("size"),
  data: text(),
  storageKey: text("storage_key"),

  ...timestampColumns,
});
