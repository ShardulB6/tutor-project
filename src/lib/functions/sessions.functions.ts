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
  .handler(async () => {});

export const saveChatMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string(),
      notebookId: z.string().brand("NotebookId"),
      message: z.string(),
      role: z.string(),
      AIModel: z.string(),
    }),
  )
  .handler(async ({ data: _data }) => {
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

export class myAgent extends Think<Env, unknown, { modelName: string }> {
  getModel() {
    return createVercel({ apiKey: process.env.AI_GATEWAY_API_KEY })(this.name);
  }
}
