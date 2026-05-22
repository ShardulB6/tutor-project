import { Agent } from "agents";
import { SessionManager } from "agents/experimental/memory/session";
import crypto from "node:crypto";
import { db } from "#/db";
import { SessionMessagesTable } from "#/db/schema";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  parts: Array<{ type: "text"; text: string }>;
};

export class MyAgent extends Agent<Env> {
  manager = SessionManager.create(this)
    .withContext("soul", {
      provider: {
        get: async () => "You are a helpful support assistant.",
      },
    })
    .withContext("memory", {
      description: "Facts learned about the user",
      maxTokens: 1100,
    })
    .withCachedPrompt();

  createChat(name: string) {
    return this.manager.create(name);
  }

  async onChatMessage(sessionId: string, message: ChatMessage) {
    await this.manager.append(sessionId, message);

    const session = this.manager.getSession(sessionId);
    const system = await session.freezeSystemPrompt();
    const history = this.manager.getHistory(sessionId);
    const tools = await session.tools();

    // Insert the incoming user message
    await db.insert(SessionMessagesTable).values({
      sessionID: sessionId,
      notebookID: "default",
      id: message.id || crypto.randomUUID(),
      parentID: null,
      role: message.role,
      content: JSON.stringify(message.parts),
      textContent: message.parts.map((part) => part.text).join(" "),
    });

    // Generate assistant reply (placeholder). Replace this with real model call.
    const assistantText = `Echo: ${message.parts.map((p) => p.text).join(" ")}`;
    const assistantParts = [{ type: "text", text: assistantText }];

    // Insert the assistant message, referencing the user message as parent
    await db.insert(SessionMessagesTable).values({
      sessionID: sessionId,
      notebookID: "default",
      id: crypto.randomUUID(),
      parentID: message.id || null,
      role: "assistant",
      content: JSON.stringify(assistantParts),
      textContent: assistantText,
    });
  }
}
