import { createServerFn } from "@tanstack/react-start";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import { NotebooksTable } from "#/db/schema";
import { createUpdateSchema, createInsertSchema } from "drizzle-zod";

import { eq, and } from "drizzle-orm";
import z from "zod";


export const getChatMessages = createServerFn({ method: "GET" }).handler(async () => {
    const session = await ensureSession();
    const messagesResult = db
      .select()
      .from(NotebooksTable)
      .where(eq(NotebooksTable.userID, session.user.id));

    return messagesResult;
});

export const createChatMessage = createServerFn({ method: "POST" })


