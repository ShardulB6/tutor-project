import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createTestDatabase } from "./support";

const state = vi.hoisted(() => ({
  database: undefined as ReturnType<typeof createTestDatabase> | undefined,
  userId: "user-a",
  objects: new Set<string>(),
  list: vi.fn(),
  delete: vi.fn(),
  put: vi.fn(),
}));
vi.mock("#/db", () => ({
  get db() {
    return state.database!.db;
  },
}));
vi.mock("cloudflare:workers", () => ({
  env: {
    TUTOR_BUCKET: {
      list: state.list,
      delete: state.delete,
      put: state.put,
    },
  },
}));
vi.mock("@tanstack/react-start", async () => ({
  createServerFn: (await import("./support")).createServerFn,
  createServerOnlyFn: (fn: unknown) => fn,
}));
vi.mock("#/lib/auth/auth.functions", () => ({
  ensureAuthSession: async () => ({ user: { id: state.userId } }),
}));
import { deleteServerNotebook } from "../../src/lib/functions/notebooks.functions";
import { saveFileSchema } from "../../src/lib/functions/file.functions";

const notebookId = z.string().brand<"NotebookId">().parse("notebook-a");
const removeNotebook = () => deleteServerNotebook({ data: { id: notebookId } });
function upload() {
  const formData = new FormData();
  formData.set("file", new File(["%PDF-1.7"], "test.pdf", { type: "application/pdf" }));
  formData.set("notebookId", notebookId);
  return saveFileSchema({ data: formData });
}

describe("notebook deletion", () => {
  beforeEach(() => {
    state.database = createTestDatabase();
    state.userId = "user-a";
    state.objects = new Set(["user-a/notebook-a/file-a", "user-b/notebook-b/file-b"]);
    state.list.mockImplementation(async ({ prefix, limit }: { prefix: string; limit: number }) => ({
      objects: [...state.objects]
        .filter((key) => key.startsWith(prefix))
        .sort()
        .slice(0, limit)
        .map((key) => ({ key })),
    }));
    state.delete.mockImplementation(async (keys: string | string[]) => {
      for (const key of typeof keys === "string" ? [keys] : keys) state.objects.delete(key);
    });
    state.put.mockImplementation(async (key: string) => {
      state.objects.add(key);
    });
  });
  afterEach(() => state.database?.sqlite.close());

  it("drains multiple pages including orphaned objects and cascades file metadata", async () => {
    for (let i = 0; i < 1_005; i++) state.objects.add(`user-a/notebook-a/orphan-${i}`);
    state.objects.add("user-a/notebook-a-other/file");
    await removeNotebook();
    expect([...state.objects]).toEqual([
      "user-b/notebook-b/file-b",
      "user-a/notebook-a-other/file",
    ]);
    expect(state.delete.mock.calls.every(([keys]) => keys.length <= 1_000)).toBe(true);
    expect(
      state.database!.sqlite.prepare("SELECT id FROM notebook WHERE id = ?").get(notebookId),
    ).toBeUndefined();
    expect(
      state.database!.sqlite.prepare("SELECT id FROM files WHERE notebook_id = ?").get(notebookId),
    ).toBeUndefined();
    await expect(removeNotebook()).resolves.toEqual({ success: true });
  });

  it("batches tracked legacy keys outside the current upload prefix", async () => {
    const insert = state.database!.sqlite.prepare(
      "INSERT INTO files (id,title,notebook_id,userID,storage_key) VALUES (?, 'old.pdf', 'notebook-a', 'user-a', ?)",
    );
    for (let i = 0; i < 1_005; i++) {
      const key = `legacy-${i}`;
      insert.run(key, key);
      state.objects.add(key);
    }
    await removeNotebook();
    expect([...state.objects]).toEqual(["user-b/notebook-b/file-b"]);
    expect(state.delete.mock.calls.every(([keys]) => keys.length <= 1_000)).toBe(true);
  });

  it("retains deletion state and metadata when storage fails, then completes on retry", async () => {
    state.delete.mockRejectedValueOnce(new Error("R2 unavailable"));
    await expect(removeNotebook()).rejects.toThrow("R2 unavailable");
    expect(
      state
        .database!.sqlite.prepare("SELECT is_deleting FROM notebook WHERE id = ?")
        .get(notebookId),
    ).toMatchObject({ is_deleting: 1 });
    expect(state.objects.has("user-a/notebook-a/file-a")).toBe(true);
    await removeNotebook();
    expect(state.objects.has("user-a/notebook-a/file-a")).toBe(false);
  });

  it("does not touch another user's notebook or storage", async () => {
    state.userId = "user-b";
    await removeNotebook();
    expect(state.list).not.toHaveBeenCalled();
    expect(state.delete).not.toHaveBeenCalled();
    expect(
      state
        .database!.sqlite.prepare("SELECT is_deleting FROM notebook WHERE id = ?")
        .get(notebookId),
    ).toMatchObject({ is_deleting: 0 });
  });

  it("rolls back an upload that finishes after notebook cleanup", async () => {
    state.put.mockImplementationOnce(async (key: string) => {
      await removeNotebook();
      state.objects.add(key);
    });
    await expect(upload()).rejects.toThrow("unauthorized");
    expect([...state.objects]).toEqual(["user-b/notebook-b/file-b"]);
  });

  it("rejects new uploads while deletion awaits retry", async () => {
    state.delete.mockRejectedValueOnce(new Error("R2 unavailable"));
    await expect(removeNotebook()).rejects.toThrow();
    await expect(upload()).rejects.toThrow("unauthorized");
    expect(state.put).not.toHaveBeenCalled();
  });
});
