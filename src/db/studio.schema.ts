import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import crypto from "node:crypto";
import { z } from "zod";
import { NotebooksTable, timestampColumns, type NotebookId } from "./schema";

export const studioTable = sqliteTable("studioTable", {});
