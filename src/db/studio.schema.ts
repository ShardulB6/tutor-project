import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";

import { NotebooksTable, timestampColumns, type NotebookId } from "./schema";
import { TITLE_STATUSES } from "./schema";

export const STUDIO_TYPES = ["exam", "quiz", "flashcards"] as const;

export type StudioType = (typeof STUDIO_TYPES)[number];
export type StudioId = string & z.$brand<"StudioId">;

export const studioTable = sqliteTable("studioTable", {
  type: text("type", { enum: STUDIO_TYPES }).notNull(),
  title: text().notNull(),
  content: text("content", { mode: "json" }).notNull(),
  sourceFileIds: text("source_file_ids", { mode: "json" }).$type<string[]>().default([]).notNull(),
  settings: text("settings", { mode: "json" })
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  model: text("model"),
  error: text("error"),
  schemaVersion: integer("schema_version").default(1).notNull(),
  status: text("title_status", { enum: TITLE_STATUSES }).default("pending").notNull(),
  id: text("id").$type<StudioId>().notNull(),
  notebookID: text("notebook_id")
    .$type<NotebookId>()
    .references(() => NotebooksTable.id, { onDelete: "cascade" })
    .notNull(),
  ...timestampColumns,
});
