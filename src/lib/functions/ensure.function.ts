import { createServerOnlyFn } from "@tanstack/react-start";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import {
  type NotebookId,
} from "#/db/schema";

import { and, eq } from "drizzle-orm";

export const ensureNotebook = createServerOnlyFn(async (notebookID: NotebookId) => {
  const session = await ensureSession();
  const notebooksResult = await db.query.NotebooksTable.findFirst({
    where: (NotebooksTable) =>
      and(eq(NotebooksTable.id, notebookID), eq(NotebooksTable.userID, session.user.id)),
  });
  if (notebooksResult === undefined) {
    throw Error("unauthorized");
  }

  return notebooksResult;
});
