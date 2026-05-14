import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { env } from "../env";
import { db } from "#/db";
import { MessagesTable, NotebooksTable, ThreadsTable } from "#/db/schema";

import { and, eq } from "drizzle-orm";
import z from "zod";
import { ensureNotebook, ensureThread, ensureMessage } from "./ensure.function";
import { createThread } from "./threads.functions";
import { createGateway, streamText } from "ai";
import { Notebook } from "lucide-react";

export const createMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      message: z.string(),
      AIModelName: z.string(),
      threadID: z.string().brand<"ThreadId">(),
    }),
  )
  .handler(async ({ data }) => {
    await ensureThread(data.threadID);
    await db.insert(MessagesTable).values({
      message: data.message,
      roles: "user",
      threadID: data.threadID,
    });

    const vercelGateway = createGateway({
      apiKey: env.AI_GATEWAY_API_KEY,
    });

    const { textStream } = streamText({
      model: vercelGateway(`${data.AIModelName}`),
      prompt: data.message,
      onFinish: async ({ text, usage, finishReason }) => {
        await db.insert(MessagesTable).values({
          message: text,
          roles: "assistant",
          threadID: data.threadID,
        });
      },
    });

    return textStream;
  });

export const createMessageWithoutThread = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      message: z.string(),
      AIModelName: z.string(),
      notebookID: z.string().brand<"NotebookId">(),
    }),
  )
  .handler(async ({ data }) => {
    const threadID = await createThread({
      data: { title: "New Thread", notebookID: data.notebookID },
    });
    await db.insert(MessagesTable).values({
      message: data.message,
      roles: "user",
      threadID,
    });

    const vercelGateway = createGateway({
      apiKey: env.AI_GATEWAY_API_KEY,
    });

    const { textStream } = streamText({
      model: vercelGateway(`${data.AIModelName}`),
      prompt: data.message,
      onFinish: async ({ text, usage, finishReason }) => {
        await db.insert(MessagesTable).values({
          message: text,
          roles: "assistant",
          threadID,
        });
      },
    });

    return textStream;
  });

export const getMessages = createServerFn({ method: "GET" })
  .inputValidator(z.object({ threadID: z.string().brand<"ThreadId">() }))
  .handler(async ({ data }) => {
    await ensureThread(data.threadID);
    const messages = await db
      .select()
      .from(MessagesTable)
      .where(eq(MessagesTable.threadID, data.threadID));
    return messages;
  });

export const updateMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ messageID: z.string().brand<"MessageId">(), message: z.string() }))
  .handler(async ({ data }) => {
    await ensureMessage(data.messageID);
    await db
      .update(MessagesTable)
      .set({ message: data.message })
      .where(eq(MessagesTable.id, data.messageID));
    return { success: true };
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ messageID: z.string().brand<"MessageId">() }))
  .handler(async ({ data }) => {
    await ensureMessage(data.messageID);
    await db.delete(MessagesTable).where(eq(MessagesTable.id, data.messageID));
    return { success: true };
  });
