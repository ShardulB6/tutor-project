import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import z from "zod";
import { Session } from "agents/experimental/memory/session";
import { db } from "#/db";
import type { NotebookId } from "#/db/schema";
import { createServerOnlyFn } from "@tanstack/react-start";
import { D1SessionProvider } from "../sessions/d1-session-provider";
import { ensureNotebook } from "./ensure.function";
import { convertToModelMessages, createUIMessageStream, streamText, type UIMessage } from "ai";
import type { SessionMessage } from "agents/experimental/memory/session";

type SerializableChatMessage = {
  id: string;
  role: SessionMessage["role"];
  parts: Array<{ type: "text"; text: string }>;
};

function toSerializableChatMessage(message: SessionMessage): SerializableChatMessage {
  return {
    id: message.id,
    role: message.role,
    parts: message.parts
      .filter((part) => part.type === "text")
      .map((part) => ({ type: "text", text: part.text ?? "" })),
  };
}

async function createD1ChatSession(notebookId: NotebookId, sessionId?: string): Promise<Session> {
  const resolvedSessionId = sessionId ?? crypto.randomUUID();
  const provider = await D1SessionProvider.create(db, notebookId, resolvedSessionId);

  return Session.create(provider).forSession(resolvedSessionId);
}

export const getChatSession = createServerOnlyFn(
  async (notebookId: NotebookId, sessionId?: string) => {
    await ensureNotebook(notebookId);
    return createD1ChatSession(notebookId, sessionId);
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
      AIModel: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const request = getRequest();

    const userMessage: UIMessage = {
      role: "user",
      id: crypto.randomUUID(),
      parts: [
        {
          type: "text",
          text: data.message,
        },
      ],
    };
    const chatSession = await getChatSession(data.notebookId, data.sessionId);
    await chatSession.appendMessage(userMessage);
    const result = streamText({
      model: data.AIModel,
      messages: await convertToModelMessages([userMessage]),
      abortSignal: request.signal,
    });

    const saveAssistantMessage = async (message: UIMessage) => {
      await chatSession.appendMessage(message);
    };

    const uiMessageStream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.merge(result.toUIMessageStream());
      },
      generateId: () => crypto.randomUUID(),
      onStepFinish: ({ responseMessage }) => saveAssistantMessage(responseMessage),
      onFinish: ({ responseMessage }) => saveAssistantMessage(responseMessage),
    });

    await uiMessageStream.pipeTo(new WritableStream());
  });

export const CreateBranch = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string(),
      notebookId: z.string().brand("NotebookId"),
      messageId: z.string(),
      leafId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const chatSession = await getChatSession(data.notebookId, data.sessionId);
    await chatSession.getBranches(data.messageId);
  });

export const getMessages = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      sessionId: z.string(),
      notebookId: z.string().brand("NotebookId"),
      leafId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const chatSession = await getChatSession(data.notebookId, data.sessionId);
    const messages = await chatSession.getHistory(data.leafId);

    return messages.map(toSerializableChatMessage);
  });
