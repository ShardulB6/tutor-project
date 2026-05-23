import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { Session } from "agents/experimental/memory/session";
import { db } from "#/db";
import type { NotebookId } from "#/db/schema";
import { createServerOnlyFn } from "@tanstack/react-start";
import { D1SessionProvider } from "../sessions/d1-session-provider";
import { ensureNotebook } from "./ensure.function";

export const getChatSession = createServerOnlyFn(
  async (notebookId: NotebookId, sessionId?: string) => {
    await ensureNotebook(notebookId);
    return new Session(
      await D1SessionProvider.create(db, notebookId, sessionId ?? crypto.randomUUID()),
    );
  },
);

export const getServerNotebooks = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sessionId: z.string(), notebookId: z.string().brand("NotebookId") }))
  .handler(async ({ data }) => {
    const chatSession = await getChatSession(data.notebookId, data.sessionId);
  });
