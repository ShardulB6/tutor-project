import { Think, Session, type TurnContext } from "@cloudflare/think";
import type { OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import { createGateway, gateway } from "ai";
import { callable } from "agents";
import { drizzle } from "drizzle-orm/d1";
import { dbSchema } from "#/db/db-schema";
import type { NotebookId } from "#/db/schema";
import {
  DEFAULT_TUTOR_MODEL,
  DEFAULT_TUTOR_REASONING_LEVEL,
  isTutorModelId,
  isTutorReasoningLevel,
  supportsTutorReasoning,
  supportsTutorReasoningSummary,
} from "#/lib/models";
import { D1SessionProvider } from "#/lib/sessions/d1-session-provider";
import { createListNotebookFilesTool } from "./tools/list-notebook-files";
import { createReadNotebookFileTool } from "./tools/read-notebook-file";

export class TutorAgent extends Think<Cloudflare.Env> {
  workspaceBash = false;
  private readonly gatewayCredentials = new Map<
    string,
    { apiKey: string; disposeKeepAlive: () => void; expiresAt: number }
  >();

  getModel() {
    return gateway(DEFAULT_TUTOR_MODEL);
  }

  @callable()
  async prepareVercelAiGatewayKey(apiKey: string): Promise<string> {
    if (typeof apiKey !== "string" || apiKey.length > 4_096 || !apiKey.trim()) {
      throw new Error("A valid Vercel AI Gateway API key is required.");
    }

    this.deleteExpiredGatewayCredentials();

    const credential = crypto.randomUUID();
    const disposeKeepAlive = await this.keepAlive();
    this.gatewayCredentials.set(credential, {
      apiKey: apiKey.trim(),
      disposeKeepAlive,
      expiresAt: Date.now() + 60_000,
    });
    setTimeout(() => this.deleteGatewayCredential(credential), 60_000);

    return credential;
  }

  override beforeTurn({ body }: TurnContext) {
    const modelId = isTutorModelId(body?.model) ? body.model : DEFAULT_TUTOR_MODEL;
    const model = createGateway({
      apiKey: this.consumeGatewayCredential(body?.gatewayCredential),
    })(modelId);

    if (!supportsTutorReasoning(modelId)) {
      return { model };
    }

    const reasoningLevel = isTutorReasoningLevel(body?.reasoningLevel)
      ? body.reasoningLevel
      : DEFAULT_TUTOR_REASONING_LEVEL;
    const supportsReasoningSummary = supportsTutorReasoningSummary(modelId);
    const openaiOptions = {
      reasoningEffort: reasoningLevel,
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

  private consumeGatewayCredential(value: unknown): string {
    if (typeof value !== "string") {
      throw new Error("Add a Vercel AI Gateway API key in Settings before using the tutor.");
    }

    const credential = this.gatewayCredentials.get(value);
    this.deleteGatewayCredential(value);

    if (!credential || credential.expiresAt < Date.now()) {
      throw new Error("Your AI Gateway credential expired. Send the message again.");
    }

    return credential.apiKey;
  }

  private deleteExpiredGatewayCredentials(): void {
    const now = Date.now();
    for (const [credential, value] of this.gatewayCredentials) {
      if (value.expiresAt < now) {
        this.deleteGatewayCredential(credential);
      }
    }
  }

  private deleteGatewayCredential(credential: string): void {
    const value = this.gatewayCredentials.get(credential);
    if (!value) {
      return;
    }

    this.gatewayCredentials.delete(credential);
    value.disposeKeepAlive();
  }

  getSystemPrompt() {
    return `You are a focused tutor. Explain concepts clearly, ask useful follow-up questions,
and adapt answers to the student's notebook context.

When a question depends on material in the notebook, use the notebook tools before answering:
1. Call listNotebookFiles and use filenames and user-provided topics to identify relevant files.
2. Call readNotebookFile for each relevant file ID to read its contents.
3. Base the answer on the contents returned by the tool.

If the relevant file is unclear, call listNotebookFiles and ask the student which file they mean.
Topics are file-selection hints that may be empty or incomplete, not a substitute for reading a file.
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
