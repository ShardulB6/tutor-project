import { Session } from "agents/experimental/memory/session";
import type { db } from "#/db";
import type { NotebookId } from "#/db/schema";
import { D1SessionProvider } from "./d1-session-provider";

type Database = typeof db;

export const createSession = async (
  sessionId: string,
  database: Database,
  notebookId: NotebookId,
) => new Session(await D1SessionProvider.create(database, notebookId, sessionId));

export { D1SessionProvider };
