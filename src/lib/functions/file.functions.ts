import { db } from "#/db";
import { files } from "#/db/file-schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import crypto from "node:crypto";
import { z } from "zod";
import { ensureNotebook } from "./ensure.function";

const saveFileSchema = z
  .object({
    notebookId: z.string().brand<"NotebookId">(),
    title: z.string().min(1),
    size: z.number().int().nonnegative().optional(),
    data: z.string().optional(),
    storageKey: z.string().optional(),
  })
  .strip();

export const saveServerFile = createServerFn({ method: "POST" })
  .inputValidator(saveFileSchema)
  .handler(async ({ data }) => {
    const notebook = await ensureNotebook(data.notebookId);
    const id = crypto.randomUUID();

    await db.insert(files).values({
      id,
      title: data.title,
      notebookID: data.notebookId,
      userID: notebook.userID,
      size: data.size,
      data: data.data,
      storageKey: data.storageKey,
    });

    return { id, success: true };
  });

export const deleteServerFile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      notebookId: z.string().brand<"NotebookId">(),
      fileId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const notebook = await ensureNotebook(data.notebookId);

    await db
      .delete(files)
      .where(
        and(
          eq(files.id, data.fileId),
          eq(files.notebookID, data.notebookId),
          eq(files.userID, notebook.userID),
        ),
      );

    return { success: true };
  });
