import { createServerFn } from "@tanstack/react-start";

import { db } from "#/db";
import { NotebooksTable } from "#/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { ensureNotebook, ensureThread } from "./ensure.function";
import { examsTable, flashcardsTable } from "#/db/studio.schema";

export const createStudioObject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      notebookId: z.string().brand<"NotebookId">(),
      sessionId: z.string().brand<"SessionId">(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureNotebook(data.notebookId);
    await ensureThread(data.notebookId, data.sessionId);
  });
