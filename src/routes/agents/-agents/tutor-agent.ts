import { Think, Session, type TurnContext } from "@cloudflare/think";
import type { OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import { gateway } from "ai";
import { drizzle } from "drizzle-orm/d1";
import { dbSchema } from "#/db/db-schema";
import type { NotebookId } from "#/db/schema";
import { DEFAULT_TUTOR_MODEL, isTutorModelId, type TutorModelId } from "#/lib/models";
import { D1SessionProvider } from "#/lib/sessions/d1-session-provider";
import { createListNotebookFilesTool } from "./tools/list-notebook-files";
import { createReadNotebookFileTool } from "./tools/read-notebook-file";

const REASONING_MODEL_IDS: ReadonlySet<TutorModelId> = new Set([
  "openai/o1",
  "openai/o3",
  "openai/gpt-5.4",
]);

const REASONING_SUMMARY_MODEL_IDS: ReadonlySet<TutorModelId> = new Set([
  "openai/o3",
  "openai/gpt-5.4",
]);

export class TutorAgent extends Think<Cloudflare.Env> {
  workspaceBash = false;

  getModel() {
    return gateway(DEFAULT_TUTOR_MODEL);
  }

  override beforeTurn({ body }: TurnContext) {
    const modelId = isTutorModelId(body?.model) ? body.model : DEFAULT_TUTOR_MODEL;
    const model = gateway(modelId);

    if (!REASONING_MODEL_IDS.has(modelId)) {
      return { model };
    }

    const supportsReasoningSummary = REASONING_SUMMARY_MODEL_IDS.has(modelId);
    const openaiOptions = {
      reasoningEffort: "medium",
      ...(supportsReasoningSummary ? { reasoningSummary: "auto" } : {}),
    } satisfies OpenAILanguageModelResponsesOptions;

    return {
      model,
      sendReasoning: supportsReasoningSummary,
      providerOptions: {
        openai: openaiOptions,
      },
    };
  }

  getSystemPrompt() {
    return `You are a focused tutor. Explain concepts clearly, ask useful follow-up questions,
and adapt answers to the student's notebook context.

When a question depends on material in the notebook, use the notebook tools before answering:
1. Call listNotebookFiles to find the relevant file and its ID.
2. Call readNotebookFile with that file ID to read its contents.
3. Base the answer on the contents returned by the tool.

If the relevant file is unclear, call listNotebookFiles and ask the student which file they mean.
Do not claim to know a notebook file's contents unless you have read it with readNotebookFile.`;
  }

  override getTools() {
    const { notebookId } = parseAgentName(this.name);

    return {
      listNotebookFiles: createListNotebookFilesTool({ env: this.env, notebookId }),
      readNotebookFile: createReadNotebookFileTool({ env: this.env, notebookId }),
    };
  }

  override async configureSession(_session: Session): Promise<Session> {
    const { notebookId, sessionId } = parseAgentName(this.name);
    const database = drizzle(this.env.DB, { schema: dbSchema });
    const provider = await D1SessionProvider.create(database, notebookId, sessionId);

    return Session.create(provider).forSession(sessionId);
  }
}

function parseAgentName(name: string): { notebookId: NotebookId; sessionId: string } {
  const [notebookId, sessionId] = decodeURIComponent(name).split(":");

  if (!notebookId) {
    throw new Error("TutorAgent name must include a notebook id");
  }

  return {
    notebookId: notebookId as NotebookId,
    sessionId: sessionId || notebookId,
  };
}
