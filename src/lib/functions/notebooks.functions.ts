import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import { notebooks } from "#/db/schema";
import { eq } from "drizzle-orm";

export const getServerNotebooks = createServerFn({ method: "GET" }).handler(async () => {
  const session = await ensureSession();
  const notebooksResult = db.select().from(notebooks).where(eq(notebooks.userID, session.user.id));

  return notebooksResult;
});

export const createServerNotebook = createServerFn({ method: "POST" })
  .inputValidator(z.object({ title: z.string().min(1) }))
  .handler(async ({ data }: { data: { title: string } }) => {
    const session = await ensureSession();

    const [notebook] = await db
      .insert(notebooks)
      .values({
        title: data.title,
        userID: session.user.id,
      })
      .returning();

    return notebook;
  });
