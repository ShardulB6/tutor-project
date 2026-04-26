import { createServerFn } from "@tanstack/react-start";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import { NotebooksTable, ThreadsTable } from "#/db/schema";
import { createUpdateSchema, createInsertSchema } from "drizzle-zod";

import { eq, and } from "drizzle-orm";
import z from "zod";

const Thread = createInsertSchema(ThreadsTable)
  .pick({

    title: true,
  })
  .strip();

export const createThread = createServerFn({ method: "POST" })
  .inputValidator(Thread)
  .handler(async ({ data }) => {


    const [thread] = await db
      .insert(ThreadsTable)
      .values({
        title: data.title,
      })
      .returning();

    return thread;
  });

export const updateThread = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().brand<"ThreadId">(),
      data: Thread,
    }),
  )
  .handler(async ({ data }) => {


    const [thread] = await db
      .update(ThreadsTable)
      .set(data.data)
      .where(eq(ThreadsTable.id, data.id))
      .returning();

    return thread;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().brand<"ThreadId">(),
    }),
  )
  .handler(async ({ data }) => {

    const [Thread] = await db
      .delete(ThreadsTable)
      .where(eq(ThreadsTable.id, data.id))
      .returning();

    return Thread;
  });

export const getThreads = createServerFn({ method: "GET" }).handler(async () => {
  const session = await ensureSession();
  const notebooksResult = db
    .select()
    .from(ThreadsTable)
    .where(
      and(
        eq(ThreadsTable.notebookID, NotebooksTable.id),
        eq(NotebooksTable.userID, session.user.id),
      ),
    );

  return notebooksResult;
});