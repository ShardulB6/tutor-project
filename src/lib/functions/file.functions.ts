import { db } from "#/db";
import { files } from "#/db/file-schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import crypto from "node:crypto";
import { z } from "zod";
import { ensureNotebook } from "./ensure.function";

const fileDataUrlPattern = /^data:([^;,]+)?(?:;[^,]*)?;base64,(.*)$/;

const saveFileSchema = z
  .object({
    notebookId: z.string().brand<"NotebookId">(),
    title: z.string().min(1),
    size: z.number().int().nonnegative().optional(),
    contentType: z.string().min(1).optional(),
    data: z.string().min(1),
  })
  .strip();

function decodeFileData(data: string) {
  const match = fileDataUrlPattern.exec(data);
  const contentType = match?.[1];
  const payload = match?.[2] ?? data;

  return {
    contentType,
    bytes: Buffer.from(payload, "base64"),
  };
}

export const saveServerFile = createServerFn({ method: "POST" })
  .inputValidator(saveFileSchema)
  .handler(async ({ data }) => {
    const notebook = await ensureNotebook(data.notebookId);
    const id = crypto.randomUUID();
    const storageKey = `users/${notebook.userID}/notebooks/${data.notebookId}/files/${id}`;
    const fileData = decodeFileData(data.data);
    const contentType = data.contentType ?? fileData.contentType ?? "application/octet-stream";

    await env.TUTOR_BUCKET.put(storageKey, fileData.bytes, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        fileId: id,
        notebookId: data.notebookId,
        userId: notebook.userID,
      },
    });

    await db.insert(files).values({
      id,
      title: data.title,
      notebookID: data.notebookId,
      userID: notebook.userID,
      size: data.size,
      contentType,
      storageKey,
    });

    return { id, storageKey, success: true };
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
    const [file] = await db
      .select({ storageKey: files.storageKey })
      .from(files)
      .where(
        and(
          eq(files.id, data.fileId),
          eq(files.notebookID, data.notebookId),
          eq(files.userID, notebook.userID),
        ),
      )
      .limit(1);

    await db
      .delete(files)
      .where(
        and(
          eq(files.id, data.fileId),
          eq(files.notebookID, data.notebookId),
          eq(files.userID, notebook.userID),
        ),
      );

    if (file?.storageKey) {
      await env.TUTOR_BUCKET.delete(file.storageKey);
    }

    return { success: true };
  });
