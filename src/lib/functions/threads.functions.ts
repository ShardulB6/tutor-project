import { createServerFn } from "@tanstack/react-start";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import { NotebooksTable, ThreadsTable } from "#/db/schema";
import { createUpdateSchema, createInsertSchema } from "drizzle-zod";

import { eq, and } from "drizzle-orm";
import z from "zod";

export const getChatMessages = createServerFn({ method: "GET" }).handler(async () => {
  const session = await ensureSession();
  const messagesResult = db
    .select()
    .from(NotebooksTable)
    .where(
      and(
        eq(ThreadsTable.notebookID, NotebooksTable.id),
        eq(NotebooksTable.userID, session.user.id),
      ),
    );

  return messagesResult;
});

const insertChatMessageSchema = createInsertSchema(ThreadsTable)
  .pick({

    title: true,
  })
  .strip();

export const createThread = createServerFn({ method: "POST" })
  .inputValidator(insertChatMessageSchema)
  .handler(async ({ data }) => {
    const session = await ensureSession();

