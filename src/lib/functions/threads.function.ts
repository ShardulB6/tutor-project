import { db } from "#/db";
import { SessionMessagesTable } from "#/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { ensureNotebook } from "./ensure.function";

export const getServerThreads = createServerFn({ method: "GET" })
  .inputValidator(z.object({ notebookID: z.string().brand<"NotebookId">() }))
  .handler(async ({ data }) => {
    await ensureNotebook(data.notebookID);

    const latestUpdate = max(SessionMessagesTable.updatedAt);

    return db
      .select({
        sessionID: SessionMessagesTable.sessionID,
        updatedAt: latestUpdate,
      })
      .from(SessionMessagesTable)
      .where(eq(SessionMessagesTable.notebookID, data.notebookID))
      .groupBy(SessionMessagesTable.sessionID)
      .orderBy(desc(latestUpdate));
  });
