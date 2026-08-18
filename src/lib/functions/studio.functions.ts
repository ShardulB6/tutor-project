import { createServerFn } from "@tanstack/react-start";

import { db } from "#/db";
import { NotebooksTable } from "#/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { ensureNotebook } from "./ensure.function";
import { examsTable, flashcardsTable } from "#/db/studio.schema";

export const createStudioObject
