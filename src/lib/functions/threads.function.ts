import { db } from "#/db";
import { ChatSessionsTable, SessionCompactionsTable, SessionMessagesTable } from "#/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { ensureNotebook } from "./ensure.function";

export const getServerThreads = createServerFn({ method: "GET" })
  .inputValidator(z.object({ notebookId: z.string().brand<"NotebookId">() }))
  .handler(async ({ data }) => {
    await ensureNotebook(data.notebookId);

    return db
      .select({
        name: ChatSessionsTable.name,
        sessionID: ChatSessionsTable.sessionID,
        updatedAt: ChatSessionsTable.updatedAt,
      })
      .from(ChatSessionsTable)
      .where(eq(ChatSessionsTable.notebookID, data.notebookId))
      .orderBy(desc(ChatSessionsTable.updatedAt));
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

    await db
      .delete(SessionMessagesTable)
      .where(
        and(
          eq(SessionMessagesTable.notebookID, data.notebookId),
          eq(SessionMessagesTable.sessionID, data.sessionId),
        ),
      );

    await db
      .delete(SessionCompactionsTable)
      .where(
        and(
          eq(SessionCompactionsTable.notebookID, data.notebookId),
          eq(SessionCompactionsTable.sessionID, data.sessionId),
        ),
      );

    await db
      .delete(ChatSessionsTable)
      .where(
        and(
          eq(ChatSessionsTable.notebookID, data.notebookId),
          eq(ChatSessionsTable.sessionID, data.sessionId),
        ),
      );
  });
