import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { dbSchema } from "../../src/db/db-schema";

export function createTestDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE notebook (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, userID TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch())
    );
    CREATE TABLE files (
      id TEXT NOT NULL, title TEXT NOT NULL,
      notebook_id TEXT NOT NULL REFERENCES notebook(id) ON DELETE CASCADE,
      userID TEXT NOT NULL, size INTEGER, content_type TEXT, storage_key TEXT,
      topics TEXT DEFAULT '[]', created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );
    INSERT INTO notebook (id, title, userID) VALUES
      ('notebook-a', 'A', 'user-a'), ('notebook-b', 'B', 'user-b');
    INSERT INTO files (id, title, notebook_id, userID, content_type, storage_key) VALUES
      ('file-a', 'a.pdf', 'notebook-a', 'user-a', 'application/pdf', 'user-a/notebook-a/file-a'),
      ('file-b', 'b.pdf', 'notebook-b', 'user-b', 'application/pdf', 'user-b/notebook-b/file-b');
  `);
  sqlite.exec(
    readFileSync(
      new URL("../../drizzle/0017_notebook_deletion_state.sql", import.meta.url),
      "utf8",
    ),
  );
  const db = drizzle(
    async (sql, params, method) => {
      const statement = sqlite.prepare(sql);
      statement.setReturnArrays(true);
      if (method === "run") {
        statement.run(...params);
        return { rows: [] };
      }
      const rows = statement.all(...params).map((row) => {
        if (!Array.isArray(row)) throw new Error("Expected an array from SQLite");
        return row;
      });
      return { rows: method === "get" ? rows[0] : rows };
    },
    { schema: dbSchema },
  );
  return { db, sqlite };
}

// Bypass the HTTP transport while preserving input validation and handlers.
export function createServerFn() {
  return {
    handler: (fn: unknown) => fn,
    inputValidator(
      validator: ((data: unknown) => unknown) | { parse: (data: unknown) => unknown },
    ) {
      return {
        handler(fn: (options: { data: unknown }) => unknown) {
          return ({ data }: { data: unknown }) =>
            fn({
              data: typeof validator === "function" ? validator(data) : validator.parse(data),
            });
        },
      };
    },
  };
}
