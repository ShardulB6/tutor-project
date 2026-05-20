import { Session } from "agents/experimental/memory/session";
import type { db } from "#/db";
import { D1ContextProvider, D1SearchProvider } from "./d1-provider";
import { D1SessionProvider } from "./d1-session-provider";

type Database = typeof db;

export const createSession = async (sessionId: string, database: Database, tenantId: string) =>
  new Session(await D1SessionProvider.create(database, tenantId, sessionId));

export { D1ContextProvider, D1SearchProvider, D1SessionProvider };
