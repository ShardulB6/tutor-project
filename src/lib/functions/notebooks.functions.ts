import { createServerFn } from "@tanstack/react-start";
import { ensureSession } from "../auth/auth.functions";
import { db } from "#/db";
import { notebooks } from "#/db/schema";
import { eq } from "drizzle-orm";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await ensureSession();
  const notebooksResult = db.select().from(notebooks).where(eq(notebooks.userID, session.user.id));

  return notebooksResult;
});
