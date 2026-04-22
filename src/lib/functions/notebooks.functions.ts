import { createServerFn } from "@tanstack/react-start";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import { NotebooksTable } from "#/db/schema";
import { createUpdateSchema, createInsertSchema } from "drizzle-zod";
import type { useRouter } from '@tanstack/react-router'
import { eq, and } from "drizzle-orm";
import z from "zod";


export const getServerNotebooks = createServerFn({ method: "GET" }).handler(async () => {
  const session = await ensureSession();
  const notebooksResult = db
    .select()
    .from(NotebooksTable)
    .where(eq(NotebooksTable.userID, session.user.id));

  return notebooksResult;
});

const insertNotebookSchema = createInsertSchema(NotebooksTable)
  .pick({
    title: true,
  })
  .strip();

export const createServerNotebook = createServerFn({ method: "POST" })
  .inputValidator(insertNotebookSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession();

    const [notebook] = await db
      .insert(NotebooksTable)
      .values({
        title: data.title,
        userID: session.user.id,
      })
      .returning();

    return notebook;
  });

const updateNotebookSchema = createUpdateSchema(NotebooksTable)
  .pick({
    title: true,
  })
  .strip();
export const updateServerNotebook = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().brand<"NotebookId">(),
      data: updateNotebookSchema,
    }),
  )
  .handler(async ({ data }) => {
    const session = await ensureSession();

    const [notebook] = await db
      .update(NotebooksTable)
      .set(data.data)
      .where(and(eq(NotebooksTable.id, data.id), eq(NotebooksTable.userID, session.user.id)))
      .returning();

    return notebook;
  });

export const deleteServerNotebook = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().brand<"NotebookId">(),
    }),
  )
  .handler(async ({ data }) => {
    const session = await ensureSession();

    await db
      .delete(NotebooksTable)
      .where(and(eq(NotebooksTable.id, data.id), eq(NotebooksTable.userID, session.user.id)));

    return { success: true };
  });
