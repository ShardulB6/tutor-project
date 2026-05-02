import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { env } from "../env";
import { db } from "#/db";
import { MessagesTable, NotebooksTable, ThreadsTable} from "#/db/schema";

import { and, eq } from "drizzle-orm";
import z from "zod";
import { ensureNotebook, ensureThread, ensureMessage } from "./auth.functions";



export const createMessage = createServerFn({ method: "POST" })
    .inputValidator(z.object({ message: z.string(), threadID: z.string().brand<"ThreadId">() }))
    .handler(async ({ data }) => {
        await ensureThread(data.threadID);
        await db.insert(MessagesTable).values({
            message: data.message,
            roles: "user",
            threadID: data.threadID,
        });

        // add AI response generation here
        

        return { success: true };
    });

