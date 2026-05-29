import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { Session } from "agents/experimental/memory/session";
import { db } from "#/db";
import type { NotebookId } from "#/db/schema";
import { createServerOnlyFn } from "@tanstack/react-start";
import { D1SessionProvider } from "../sessions/d1-session-provider";
import { ensureNotebook } from "./ensure.function";
import { createVercel } from "@ai-sdk/vercel";
import { Think } from "@cloudflare/think";
import { env as serverEnv } from "../env";
import type { SessionMessage } from "agents/experimental/memory/session";

const defaultSoulPrompt = "You are a helpful coding assistant.";

export class myAgent extends Think<Env> {
  getModel() {
    return createVercel({ apiKey: serverEnv.AI_GATEWAY_API_KEY })("openai/gpt-oss-120b");
  }
  configureSession(session: Session) {
    return configureThinkSession(session);
  }
}

function configureThinkSession(session: Session): Session {
  return session.withContext("soul", {
    provider: {
      get: async () => defaultSoulPrompt,
    },
  });
}

async function createD1ThinkSession(notebookId: NotebookId, sessionId?: string): Promise<Session> {
  const resolvedSessionId = sessionId ?? crypto.randomUUID();
  const provider = await D1SessionProvider.create(db, notebookId, resolvedSessionId);

  return configureThinkSession(Session.create(provider).forSession(resolvedSessionId));
}

export const getChatSession = createServerOnlyFn(
  async (notebookId: NotebookId, sessionId?: string) => {
    await ensureNotebook(notebookId);
    return createD1ThinkSession(notebookId, sessionId);
  },
);

export const getServerNotebooks = createServerFn({ method: "GET" })
  .inputValidator(z.object({ sessionId: z.string(), notebookId: z.string().brand("NotebookId") }))
  .handler(async () => {});

export const saveChatMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string(),
      notebookId: z.string().brand("NotebookId"),
      message: z.string(),
      role: z.string(),
      AIModel: z.string(),
      parentId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (data.parentId == undefined) {
      data.parentId = crypto.randomUUID();
    }

    // await chatSession.appendMessage(userMessage);
    // const result = streamText({
    //   model: vercel(data.AIModel),
    //   messages: await convertToModelMessages([userMessage]),
    //   onFinish: ({ text }) => {
    //     void chatSession.appendMessage({
    //       id: crypto.randomUUID(),
    //       role: "assistant",
    //       parts: [
    //         {
    //           type: "text",
    //           text,
    //         },
    //       ],
    //     });
    //   },
    // });
  });
