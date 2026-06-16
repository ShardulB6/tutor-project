import { db } from "#/db";
import { SessionMessagesTable } from "#/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { ensureNotebook } from "./ensure.function";

export const getServerThreads = createServerFn({ method: "GET" })
  .inputValidator(z.object({ notebookId: z.string().brand<"NotebookId">() }))
  .handler(async ({ data }) => {
    await ensureNotebook(data.notebookId);

    const latestUpdate = max(SessionMessagesTable.updatedAt);

    return db
      .select({
        sessionID: SessionMessagesTable.sessionID,
        updatedAt: latestUpdate,
      })
      .from(SessionMessagesTable)
      .where(eq(SessionMessagesTable.notebookID, data.notebookId))
      .groupBy(SessionMessagesTable.sessionID)
      .orderBy(desc(latestUpdate));
  });

export const deleteServerThread = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      notebookId: z.string().brand<"NotebookId">(),
      sessionId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureNotebook(data.notebookId);
    //TODO: Clean up sessions api/agents sdk resources aswell
    await db
      .delete(SessionMessagesTable)
      .where(
        and(
          eq(SessionMessagesTable.notebookID, data.notebookId),
          eq(SessionMessagesTable.sessionID, data.sessionId),
        ),
      );
  });
