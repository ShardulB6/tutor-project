import { createServerFn } from "@tanstack/react-start";

import { db } from "#/db";
import { NotebooksTable } from "#/db/schema";
import { createInsertSchema } from "drizzle-zod";

export const createStudioOption = createServerFn({ method: "POST" });
