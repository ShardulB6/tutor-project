import { createServerFn } from "@tanstack/react-start";
import { ensureAuthSession } from "../auth/auth.functions";
import { db } from "#/db";
import { files } from "#/db/file-schema";
import { NotebooksTable } from "#/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { env } from "cloudflare:workers";

import { eq, and } from "drizzle-orm";
import z from "zod";

export const getServerNotebooks = createServerFn({ method: "GET" }).handler(async () => {
  const session = await ensureAuthSession();
  const notebooksResult = db
    .select()
    .from(NotebooksTable)
    .where(eq(NotebooksTable.userID, session.user.id));

  return notebooksResult;
});

export const getServerNotebook = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().brand<"NotebookId">() }))
  .handler(async ({ data }) => {
    const session = await ensureAuthSession();
    return db.query.NotebooksTable.findFirst({
      where: (notebook, { eq, and }) =>
        and(eq(notebook.id, data.id), eq(notebook.userID, session.user.id)),
    });
  });

const insertNotebookSchema = createInsertSchema(NotebooksTable)
  .pick({
    title: true,
  })
  .strip();

export const createServerNotebook = createServerFn({ method: "POST" })
  .inputValidator(insertNotebookSchema)
  .handler(async ({ data }) => {
    const session = await ensureAuthSession();

    await db.insert(NotebooksTable).values({
      title: data.title,
      userID: session.user.id,
    });
    return { success: true };
  });

export const updateServerNotebook = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().brand<"NotebookId">(),
      data: insertNotebookSchema,
    }),
  )
  .handler(async ({ data }) => {
    const session = await ensureAuthSession();
    await db
      .update(NotebooksTable)
      .set(data.data)
      .where(and(eq(NotebooksTable.id, data.id), eq(NotebooksTable.userID, session.user.id)));
    return { success: true };
  });

export const deleteServerNotebook = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().brand<"NotebookId">(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await ensureAuthSession();
    const notebook = await db.query.NotebooksTable.findFirst({
      where: (notebook, { eq, and }) =>
        and(eq(notebook.id, data.id), eq(notebook.userID, session.user.id)),
    });
    if (!notebook) {
      throw new Error("Notebook not found");
    }

    const notebookFiles = await db
      .select({ storageKey: files.storageKey })
      .from(files)
      .where(eq(files.notebookID, data.id));

    const storageKeys = notebookFiles.flatMap((file) => (file.storageKey ? [file.storageKey] : []));
    if (storageKeys.length > 0) {
      await env.TUTOR_BUCKET.delete(storageKeys);
    }

    await db
      .delete(NotebooksTable)
      .where(and(eq(NotebooksTable.id, data.id), eq(NotebooksTable.userID, session.user.id)));

    return { success: true };
  });
