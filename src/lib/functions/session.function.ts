import { Agent } from "agents";
import { SessionManager } from "agents/experimental/memory/session";

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

    const reply: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      parts: [{ type: "text", text: "Hello from stored session history." }],
    };

    await this.manager.append(sessionId, reply);

    return {
      system,
      history,
      tools,
      reply,
    };
  }
}
