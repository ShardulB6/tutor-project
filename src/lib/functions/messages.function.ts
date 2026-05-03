import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { env } from "../env";
import { db } from "#/db";
import { MessagesTable, NotebooksTable, ThreadsTable} from "#/db/schema";

import { and, eq } from "drizzle-orm";
import z from "zod";
import { ensureNotebook, ensureThread, ensureMessage } from "./auth.functions";
import { createGateway, streamText } from "ai";

async function getAPIKey(){
    const AI_key = env.AI_GATEWAY_API_KEY;
    return AI_key;
}

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
        const API_KEY = await getAPIKey();

        const gateway = createGateway({apiKey: API_KEY});

        const { textStream } = streamText({
            model: "meta/llama-3.1-70b",
            prompt: "what are cats?"
        })

        for await (const text of textStream) {
            await db.insert(MessagesTable).values({
                message: text,
                roles: "assistant",
                threadID: data.threadID,
            });
        }               

        return { success: true };
    });

