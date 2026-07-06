import { db } from "#/db";
import { files } from "#/db/file-schema";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import crypto from "node:crypto";
import { z } from "zod";
import { ensureNotebook } from "./ensure.function";

export const saveFileSchema = createServerFn({ method: "POST" })
  .inputValidator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected form data");
    }

    const file = data.get("file");
    const notebookId = data.get("notebookId");

    if (!(file instanceof File)) {
      throw new Error("A file is required");
    }
    if (typeof notebookId !== "string" || !notebookId) {
      throw new Error("A notebook ID is required");
    }
    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are supported");
    }

    return {
      file,
      notebookId: z.string().brand<"NotebookId">().parse(notebookId),
    };
  })
  .handler(async ({ data }) => {
    const notebook = await ensureNotebook(data.notebookId);

    const id = crypto.randomUUID();
    const storageKey = `${notebook.userID}/${data.notebookId}/${id}`;

    await env.TUTOR_BUCKET.put(storageKey, data.file, {
      httpMetadata: {
        contentType: data.file.type,
        contentDisposition: `attachment; filename="${data.file.name.replaceAll('"', "")}"`,
      },
    });

    try {
      await db.insert(files).values({
        id,
        title: data.file.name,
        notebookID: data.notebookId,
        userID: notebook.userID,
        size: data.file.size,
        contentType: data.file.type,
        storageKey,
      });
    } catch (error) {
      await env.TUTOR_BUCKET.delete(storageKey);
      throw error;
    }

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

export const getFiles = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      notebookId: z.string().brand<"NotebookId">(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureNotebook(data.notebookId);

    return db
      .select({
        id: files.id,
        title: files.title,
        notebookID: files.notebookID,
        size: files.size,
        contentType: files.contentType,
        storageKey: files.storageKey,
        createdAt: files.createdAt,
        updatedAt: files.updatedAt,
      })
      .from(files)
      .where(eq(files.notebookID, data.notebookId))
      .orderBy(desc(files.createdAt));
  });
