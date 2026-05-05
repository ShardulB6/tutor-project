import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { env } from "../env";
import { db } from "#/db";
import { MessagesTable, NotebooksTable, ThreadsTable } from "#/db/schema";

import { and, eq } from "drizzle-orm";
import z from "zod";
import { ensureNotebook, ensureThread, ensureMessage } from "./auth.functions";
import { createGateway, streamText } from "ai";

import { openai } from "@ai-sdk/openai";

async function getAPIKey() {
  return env.AI_GATEWAY_API_KEY;
}

export const createMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ message: z.string(), threadID: z.string().brand<"ThreadId">(),role: z.string() }))
  .handler(async ({ data }) => {
    await ensureThread(data.threadID);
    await db.insert(MessagesTable).values({
      message: data.message,
      roles: data.role,
      threadID: data.threadID,
    });

    const API_key = createGateway({
      apiKey: await getAPIKey(),
    });

    const { textStream } = streamText({
      model: openai("gpt-5.3-chat"),
      prompt: data.message,
      
    });

    


    return { success: true };
  });



