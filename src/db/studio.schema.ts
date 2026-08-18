import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";

import { NotebooksTable, TITLE_STATUSES, timestampColumns, type NotebookId } from "./schema";

export type ExamId = string & z.$brand<"ExamId">;
export type FlashcardsId = string & z.$brand<"FlashcardsId">;

export type ExamQuestion = {
  question: string;
  choices?: string[];
  answer: string;
  explanation?: string;
};

export type Flashcard = {
  front: string;
  back: string;
};

export const examsTable = sqliteTable("exams", {
  id: text("id").$type<ExamId>().primaryKey(),
  notebookID: text("notebook_id")
    .$type<NotebookId>()
    .references(() => NotebooksTable.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  questions: text("questions", { mode: "json" }).$type<ExamQuestion[]>().notNull(),
  sourceFileIds: text("source_file_ids", { mode: "json" }).$type<string[]>().default([]).notNull(),
  settings: text("settings", { mode: "json" })
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  model: text("model"),
  error: text("error"),
  schemaVersion: integer("schema_version").default(1).notNull(),
  status: text("title_status", { enum: TITLE_STATUSES }).default("pending").notNull(),
  ...timestampColumns,
});

export const flashcardsTable = sqliteTable("flashcards", {
  id: text("id").$type<FlashcardsId>().primaryKey(),
  notebookID: text("notebook_id")
    .$type<NotebookId>()
    .references(() => NotebooksTable.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  cards: text("cards", { mode: "json" }).$type<Flashcard[]>().notNull(),
  sourceFileIds: text("source_file_ids", { mode: "json" }).$type<string[]>().default([]).notNull(),
  settings: text("settings", { mode: "json" })
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  model: text("model"),
  error: text("error"),
  schemaVersion: integer("schema_version").default(1).notNull(),
  status: text("title_status", { enum: TITLE_STATUSES }).default("pending").notNull(),
  ...timestampColumns,
});
