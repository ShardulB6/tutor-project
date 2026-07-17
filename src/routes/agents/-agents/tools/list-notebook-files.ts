import { dbSchema } from "#/db/db-schema";
import type { NotebookId } from "#/db/schema";
import { tool } from "ai";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";

type ListNotebookFilesToolOptions = {
  env: Pick<Cloudflare.Env, "DB">;
  notebookId: NotebookId;
};

export function createListNotebookFilesTool({ env, notebookId }: ListNotebookFilesToolOptions) {
  const database = drizzle(env.DB, { schema: dbSchema });

  return tool({
    description:
      "List the files attached to the current notebook. Use this to find a file ID before reading a file.",
    inputSchema: z.object({}),
    execute: async () => {
      return database.query.files.findMany({
        columns: {
          id: true,
          title: true,
          contentType: true,
          size: true,
        },
        where: (files) => eq(files.notebookID, notebookId),
        orderBy: (files) => desc(files.createdAt),
      });
    },
  });
}
