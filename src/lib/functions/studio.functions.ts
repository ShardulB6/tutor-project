import { createServerFn } from "@tanstack/react-start";

import { db } from "#/db";
import type { ExamId, FlashcardsId } from "#/db/studio.schema";
import { z } from "zod";
import { ensureNotebook, ensureThread } from "./ensure.function";
import { examsTable, flashcardsTable } from "#/db/studio.schema";

const studioInput = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("exam"),
    notebookId: z.string().brand<"NotebookId">(),
    sessionId: z.string().brand<"SessionId">(),
    title: z.string().min(1),
    questions: z.array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("multiple-choice"),
          question: z.string(),
          choices: z.array(z.string()).min(2),
          answer: z.string(),
          explanation: z.string().optional(),
        }),
        z.object({
          type: z.enum(["short-answer", "long-answer"]),
          question: z.string(),
          answer: z.string(),
          explanation: z.string().optional(),
        }),
      ]),
    ),
  }),
  z.object({
    type: z.literal("flashcards"),
    notebookId: z.string().brand<"NotebookId">(),
    sessionId: z.string().brand<"SessionId">(),
    title: z.string().min(1),
    cards: z.array(
      z.object({
        front: z.string(),
        back: z.string(),
      }),
    ),
  }),
]);

export const createStudioObject = createServerFn({ method: "POST" })
  .inputValidator(studioInput)
  .handler(async ({ data }) => {
    await ensureNotebook(data.notebookId);
    await ensureThread(data.notebookId, data.sessionId);

    const id = crypto.randomUUID();

    if (data.type === "exam") {
      await db.insert(examsTable).values({
        id: id as ExamId,
        notebookID: data.notebookId,
        sessionID: data.sessionId,
        title: data.title,
        questions: data.questions,
      });

      return { id, type: data.type };
    }

    await db.insert(flashcardsTable).values({
      id: id as FlashcardsId,
      notebookID: data.notebookId,
      sessionID: data.sessionId,
      title: data.title,
      cards: data.cards,
    });

    return { id, type: data.type };
  });
