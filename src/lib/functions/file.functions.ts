import { db } from "#/db";
import { files } from "#/db/file-schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import crypto from "node:crypto";
import { z } from "zod";
import { ensureNotebook } from "./ensure.function";

export const saveFileSchema = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string(),
      notebookId: z.string().brand<"NotebookId">(),
      size: z.number(),
      data: z.string(),
      contentType: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const notebook = await ensureNotebook(data.notebookId);

    const id = crypto.randomUUID();
    const storageKey = "${notebook.userID}/${data.notebookId}/${id}/${data.title}";

    await env.TUTOR_BUCKET.put(storageKey, data.data, {
      httpMetadata: {
        contentType: data.contentType,
      },
    });

    await db.insert(files).values({
      id,
      title: data.title,
      notebookID: data.notebookId,
      userID: notebook.userID,
      size: data.size,
      contentType: data.contentType,
      storageKey,
    });

    return { id, storageKey };
  });

export const deleteFile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      notebookId: z.string().brand<"NotebookId">(),
      fileId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureNotebook(data.notebookId);
    const file = await db.query.files.findFirst({
      where: (files) => and(eq(files.id, data.fileId), eq(files.notebookID, data.notebookId)),
    });
    if (!file) {
      throw new Error("File not found");
    }

    if (file.storageKey) {
      await env.TUTOR_BUCKET.delete(file.storageKey);
    }

    await db
      .delete(files)
      .where(and(eq(files.id, data.fileId), eq(files.notebookID, data.notebookId)));

    return { success: true };
  });
