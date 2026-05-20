import { and, asc, desc, eq, like } from "drizzle-orm";
import crypto from "node:crypto";
import type {
  SearchResult,
  SessionMessage,
  StoredCompaction,
} from "agents/experimental/memory/session";
import {
  SessionCompactionsTable,
  SessionContextBlocksTable,
  SessionMessagesTable,
  SessionSearchEntriesTable,
} from "#/db/schema";
import type { NotebookId } from "#/db/schema";
import type { db } from "#/db";

export type Database = typeof db;

type SessionMessageRow = typeof SessionMessagesTable.$inferSelect;

export class D1SessionProvider {
  constructor(
    private readonly database: Database,
    private readonly notebookId: NotebookId,
    private readonly sessionId: string,
  ) {}

  async getMessage(id: string): Promise<SessionMessage | null> {
    const row = await this.findMessage(id);
    return row ? this.parseMessage(row.content) : null;
  }

  async getHistory(leafId?: string | null): Promise<SessionMessage[]> {
    const leaf = leafId ? await this.findMessage(leafId) : await this.findLatestLeaf();
    if (!leaf) return [];

    const rows: SessionMessageRow[] = [];
    const seen = new Set<string>();
    let current: SessionMessageRow | undefined = leaf;

    while (current && !seen.has(current.id)) {
      rows.unshift(current);
      seen.add(current.id);
      current = current.parentID ? await this.findMessage(current.parentID) : undefined;
    }

    const messages = rows
      .map((row) => this.parseMessage(row.content))
      .filter((message): message is SessionMessage => message !== null);

    const compactions = await this.getCompactions();
    return compactions.length > 0 ? this.applyCompactions(messages, compactions) : messages;
  }

  async getLatestLeaf(): Promise<SessionMessage | null> {
    const row = await this.findLatestLeaf();
    return row ? this.parseMessage(row.content) : null;
  }

  async getBranches(messageId: string): Promise<SessionMessage[]> {
    const rows = await this.database
      .select()
      .from(SessionMessagesTable)
      .where(
        and(
          eq(SessionMessagesTable.notebookID, this.notebookId),
          eq(SessionMessagesTable.sessionID, this.sessionId),
          eq(SessionMessagesTable.parentID, messageId),
        ),
      )
      .orderBy(asc(SessionMessagesTable.createdAt), asc(SessionMessagesTable.id));

    return rows
      .map((row) => this.parseMessage(row.content))
      .filter((message): message is SessionMessage => message !== null);
  }

  async getPathLength(leafId?: string | null): Promise<number> {
    const leaf = leafId ? await this.findMessage(leafId) : await this.findLatestLeaf();
    if (!leaf) return 0;

    let count = 0;
    const seen = new Set<string>();
    let current: SessionMessageRow | undefined = leaf;

    while (current && !seen.has(current.id)) {
      count += 1;
      seen.add(current.id);
      current = current.parentID ? await this.findMessage(current.parentID) : undefined;
    }

    return count;
  }

  async appendMessage(message: SessionMessage, parentId?: string | null): Promise<void> {
    const existing = await this.findMessage(message.id);
    if (existing) return;

    let parent = parentId !== undefined ? parentId : ((await this.findLatestLeaf())?.id ?? null);

    if (parent) {
      const validParent = await this.findMessage(parent);
      if (!validParent) parent = null;
    }

    const now = new Date();
    await this.database
      .insert(SessionMessagesTable)
      .values({
        notebookID: this.notebookId,
        sessionID: this.sessionId,
        id: message.id,
        parentID: parent,
        role: message.role,
        content: JSON.stringify(message),
        textContent: this.extractSearchableText(message),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  async updateMessage(message: SessionMessage): Promise<void> {
    const now = new Date();
    await this.database
      .update(SessionMessagesTable)
      .set({
        content: JSON.stringify(message),
        textContent: this.extractSearchableText(message),
        updatedAt: now,
      })
      .where(
        and(
          eq(SessionMessagesTable.notebookID, this.notebookId),
          eq(SessionMessagesTable.sessionID, this.sessionId),
          eq(SessionMessagesTable.id, message.id),
        ),
      );
  }

  async deleteMessages(messageIds: string[]): Promise<void> {
    for (const id of messageIds) {
      await this.database
        .delete(SessionMessagesTable)
        .where(
          and(
            eq(SessionMessagesTable.notebookID, this.notebookId),
            eq(SessionMessagesTable.sessionID, this.sessionId),
            eq(SessionMessagesTable.id, id),
          ),
        );
    }
  }

  async clearMessages(): Promise<void> {
    await this.database
      .delete(SessionMessagesTable)
      .where(
        and(
          eq(SessionMessagesTable.notebookID, this.notebookId),
          eq(SessionMessagesTable.sessionID, this.sessionId),
        ),
      );

    await this.database
      .delete(SessionCompactionsTable)
      .where(
        and(
          eq(SessionCompactionsTable.notebookID, this.notebookId),
          eq(SessionCompactionsTable.sessionID, this.sessionId),
        ),
      );
  }

  async addCompaction(
    summary: string,
    fromMessageId: string,
    toMessageId: string,
  ): Promise<StoredCompaction> {
    const id = crypto.randomUUID();
    const now = new Date();

    await this.database.insert(SessionCompactionsTable).values({
      notebookID: this.notebookId,
      sessionID: this.sessionId,
      id,
      summary,
      fromMessageID: fromMessageId,
      toMessageID: toMessageId,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      summary,
      fromMessageId,
      toMessageId,
      createdAt: now.toISOString(),
    };
  }

  async getCompactions(): Promise<StoredCompaction[]> {
    const rows = await this.database
      .select()
      .from(SessionCompactionsTable)
      .where(
        and(
          eq(SessionCompactionsTable.notebookID, this.notebookId),
          eq(SessionCompactionsTable.sessionID, this.sessionId),
        ),
      )
      .orderBy(asc(SessionCompactionsTable.createdAt), asc(SessionCompactionsTable.id));

    return rows.map((row) => ({
      id: row.id,
      summary: row.summary,
      fromMessageId: row.fromMessageID,
      toMessageId: row.toMessageID,
      createdAt:
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    }));
  }

  async searchMessages(query: string, limit = 20): Promise<SearchResult[]> {
    const terms = query
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean);

    if (terms.length === 0) return [];

    const rows = await this.database
      .select({
        id: SessionMessagesTable.id,
        role: SessionMessagesTable.role,
        textContent: SessionMessagesTable.textContent,
      })
      .from(SessionMessagesTable)
      .where(
        and(
          eq(SessionMessagesTable.notebookID, this.notebookId),
          eq(SessionMessagesTable.sessionID, this.sessionId),
          ...terms.map((term) => like(SessionMessagesTable.textContent, `%${term}%`)),
        ),
      )
      .orderBy(desc(SessionMessagesTable.createdAt), desc(SessionMessagesTable.id))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.textContent,
      createdAt: "",
    }));
  }

  private async findMessage(id: string): Promise<SessionMessageRow | undefined> {
    const rows = await this.database
      .select()
      .from(SessionMessagesTable)
      .where(
        and(
          eq(SessionMessagesTable.notebookID, this.notebookId),
          eq(SessionMessagesTable.sessionID, this.sessionId),
          eq(SessionMessagesTable.id, id),
        ),
      )
      .limit(1);

    return rows[0];
  }

  private async findLatestLeaf(): Promise<SessionMessageRow | undefined> {
    const rows = await this.database
      .select()
      .from(SessionMessagesTable)
      .where(
        and(
          eq(SessionMessagesTable.notebookID, this.notebookId),
          eq(SessionMessagesTable.sessionID, this.sessionId),
        ),
      )
      .orderBy(desc(SessionMessagesTable.createdAt), desc(SessionMessagesTable.id));

    if (rows.length === 0) return undefined;

    const parentIds = new Set(
      rows.map((row) => row.parentID).filter((parentID): parentID is string => Boolean(parentID)),
    );

    return rows.find((row) => !parentIds.has(row.id));
  }

  private applyCompactions(
    messages: SessionMessage[],
    compactions: StoredCompaction[],
  ): SessionMessage[] {
    const ids = messages.map((message) => message.id);
    const result: SessionMessage[] = [];
    let index = 0;

    while (index < messages.length) {
      const matches = compactions.filter((compaction) => compaction.fromMessageId === ids[index]);
      const compaction = matches.at(-1);

      if (compaction) {
        const endIndex = ids.indexOf(compaction.toMessageId);
        if (endIndex >= index) {
          result.push({
            id: `compaction_${compaction.id}`,
            role: "assistant",
            parts: [{ type: "text", text: compaction.summary }],
            createdAt: new Date(),
          });
          index = endIndex + 1;
          continue;
        }
      }

      result.push(messages[index]);
      index += 1;
    }

    return result;
  }

  private parseMessage(json: string): SessionMessage | null {
    try {
      const value = JSON.parse(json);
      if (
        typeof value?.id === "string" &&
        typeof value?.role === "string" &&
        Array.isArray(value?.parts)
      ) {
        return value;
      }
    } catch {
      return null;
    }

    return null;
  }

  private extractSearchableText(message: SessionMessage): string {
    return message.parts
      .filter((part) => part.type === "text" && "text" in part)
      .map((part) => (part.type === "text" ? part.text : ""))
      .filter(Boolean)
      .join("\n");
  }
}

export class D1ContextProvider {
  constructor(
    private readonly database: Database,
    private readonly notebookId: NotebookId,
    private readonly sessionId: string,
    private label = "",
  ) {}

  init(label: string): void {
    if (!this.label) {
      this.label = label;
    }
  }

  async get(): Promise<string | null> {
    const rows = await this.database
      .select({ content: SessionContextBlocksTable.content })
      .from(SessionContextBlocksTable)
      .where(
        and(
          eq(SessionContextBlocksTable.notebookID, this.notebookId),
          eq(SessionContextBlocksTable.sessionID, this.sessionId),
          eq(SessionContextBlocksTable.label, this.label),
        ),
      )
      .limit(1);

    return rows[0]?.content ?? null;
  }

  async set(content: string): Promise<void> {
    const now = new Date();

    await this.database
      .insert(SessionContextBlocksTable)
      .values({
        notebookID: this.notebookId,
        sessionID: this.sessionId,
        label: this.label,
        content,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          SessionContextBlocksTable.notebookID,
          SessionContextBlocksTable.sessionID,
          SessionContextBlocksTable.label,
        ],
        set: { content, updatedAt: now },
      });
  }
}

export class D1SearchProvider {
  private label = "";

  constructor(
    private readonly database: Database,
    private readonly notebookId: NotebookId,
    private readonly sessionId: string,
  ) {}

  init(label: string): void {
    this.label = label;
  }

  async get(): Promise<string | null> {
    const rows = await this.database
      .select({ id: SessionSearchEntriesTable.key })
      .from(SessionSearchEntriesTable)
      .where(
        and(
          eq(SessionSearchEntriesTable.notebookID, this.notebookId),
          eq(SessionSearchEntriesTable.sessionID, this.sessionId),
          eq(SessionSearchEntriesTable.label, this.label),
        ),
      );

    if (rows.length === 0) return null;
    return `${rows.length} entries indexed.`;
  }

  async search(query: string): Promise<string | null> {
    const terms = query
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean);

    if (terms.length === 0) return null;

    const rows = await this.database
      .select({
        key: SessionSearchEntriesTable.key,
        content: SessionSearchEntriesTable.content,
      })
      .from(SessionSearchEntriesTable)
      .where(
        and(
          eq(SessionSearchEntriesTable.notebookID, this.notebookId),
          eq(SessionSearchEntriesTable.sessionID, this.sessionId),
          eq(SessionSearchEntriesTable.label, this.label),
          ...terms.map((term) => like(SessionSearchEntriesTable.content, `%${term}%`)),
        ),
      )
      .orderBy(desc(SessionSearchEntriesTable.updatedAt), desc(SessionSearchEntriesTable.key))
      .limit(10);

    if (rows.length === 0) return "No results found.";

    return rows.map((row) => `[${row.key}]\n${row.content}`).join("\n\n");
  }

  async set(key: string, content: string): Promise<void> {
    const now = new Date();

    await this.database
      .insert(SessionSearchEntriesTable)
      .values({
        notebookID: this.notebookId,
        sessionID: this.sessionId,
        label: this.label,
        key,
        content,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          SessionSearchEntriesTable.notebookID,
          SessionSearchEntriesTable.sessionID,
          SessionSearchEntriesTable.label,
          SessionSearchEntriesTable.key,
        ],
        set: { content, updatedAt: now },
      });
  }
}
