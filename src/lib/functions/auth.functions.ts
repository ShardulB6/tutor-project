import { createServerOnlyFn } from "@tanstack/react-start";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import {
  MessagesTable,
  NotebooksTable,
  ThreadsTable,
  type MessageId,
  type NotebookId,
  type ThreadId,
} from "#/db/schema";

import { and, eq } from "drizzle-orm";

export const ensureNotebook = createServerOnlyFn(async (notebookID: NotebookId) => {
  const session = await ensureSession();
  const notebooksResult = await db.query.NotebooksTable.findFirst({
    where: and(eq(NotebooksTable.id, notebookID), eq(NotebooksTable.userID, session.user.id)),
  });
  if (notebooksResult === undefined) {
    throw Error("unauthorized");
  }

  return notebooksResult;
});

export const ensureThread = createServerOnlyFn(async (threadID: ThreadId) => {
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

export const ensureMessage = createServerOnlyFn(async (messageID: MessageId) => {
  const session = await ensureSession();
  const messageResult = await db.query.MessagesTable.findFirst({
    where: eq(MessagesTable.id, messageID),
    with: {
      thread: {
        with: {
          notebook: true,
        },
      },
    },
  });

  if (messageResult === undefined || messageResult.thread.notebook.userID !== session.user.id) {
    throw Error("unauthorized");
  }

  return messageResult;
});
