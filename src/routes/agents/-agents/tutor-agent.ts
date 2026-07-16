import { Think, Session } from "@cloudflare/think";
import { gateway } from "ai";
import { drizzle } from "drizzle-orm/d1";
import { dbSchema } from "#/db/db-schema";
import type { NotebookId } from "#/db/schema";
import { D1SessionProvider } from "#/lib/sessions/d1-session-provider";
import { createReadNotebookFileTool } from "./tools/read-notebook-file";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

export class TutorAgent extends Think<Cloudflare.Env> {
  workspaceBash = false;

  getModel() {
    return gateway(DEFAULT_MODEL);
  }

  getSystemPrompt() {
    return `You are a focused tutor. Explain concepts clearly, 
    ask useful follow-up questions, and adapt answers to the student's notebook context.`;
  }

  override getTools() {
    const { notebookId } = parseAgentName(this.name);

    return {
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
