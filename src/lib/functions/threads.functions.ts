import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import { NotebooksTable, ThreadsTable, type NotebookId, type ThreadId } from "#/db/schema";

import { and, eq } from "drizzle-orm";
import z from "zod";

const ensureNotebook = createServerOnlyFn(async (notebookID: NotebookId) => {
  const session = await ensureSession();
  const notebooksResult = await db.query.NotebooksTable.findFirst({
    where: and(eq(NotebooksTable.id, notebookID), eq(NotebooksTable.userID, session.user.id)),
  });
  if (notebooksResult === undefined) {
    throw Error("unauthorized");
  }

  return notebooksResult;
});

const ensureThread = createServerOnlyFn(async (threadID: ThreadId) => {
  const session = await ensureSession();
  const threadResult = await db.query.ThreadsTable.findFirst({
    where: and(eq(ThreadsTable.id, threadID)),
    with: {
      notebook: true,
    },
  });
  if (threadResult === undefined || threadResult.notebook.userID !== session.user.id) {
    throw Error("unauthorized");
  }
  return threadResult;
});

export const createThread = createServerFn({ method: "POST" })
  .inputValidator(z.object({ title: z.string(), notebookID: z.string().brand<"NotebookId">() }))
  .handler(async ({ data }) => {
    await ensureNotebook(data.notebookID);
    await db.insert(ThreadsTable).values({
      title: data.title,
      notebookID: data.notebookID,
    });

    return { success: true };
  });

export const updateThread = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().brand<"ThreadId">(),
      title: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureThread(data.id);
    await db.update(ThreadsTable).set({ title: data.title }).where(eq(ThreadsTable.id, data.id));
  });

export const deleteThread = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().brand<"ThreadId">(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureThread(data.id);
    await db.delete(ThreadsTable).where(eq(ThreadsTable.id, data.id));

    return { success: true };
  });

// TODO: improve auth check and simplify for perfromance
// TODO: add pagination
export const getThreads = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      notebookID: z.string().brand<"NotebookId">(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await ensureSession();
    const notebook = await db.query.NotebooksTable.findFirst({
      where: and(
        eq(NotebooksTable.id, data.notebookID),
        eq(NotebooksTable.userID, session.user.id),
      ),
      with: {
        threads: true,
      },
    });

    if (!notebook) {
      throw new Error("Unauthorized");
    }

    return notebook.threads;
  });
